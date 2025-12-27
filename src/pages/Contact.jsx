import React, { useState, useEffect } from 'react';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaPaperPlane, FaCheckCircle, FaExclamationCircle, FaTimes } from 'react-icons/fa';
import { coursesData } from '../data/courses';
import { useLanguage } from '../context/LanguageContext';

const Contact = () => {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        course: coursesData[0]?.title || '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notification, setNotification] = useState({ show: false, type: 'success', message: '' });

    useEffect(() => {
        if (notification.show) {
            const timer = setTimeout(() => {
                setNotification(prev => ({ ...prev, show: false }));
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [notification.show]);

    const formatPhoneNumber = (value) => {
        if (!value) return value;
        const phoneNumber = value.replace(/\D/g, '');
        let numbers = phoneNumber.startsWith('998') ? phoneNumber.slice(3) : phoneNumber;
        numbers = numbers.slice(0, 9);

        let formatted = '+998';
        if (numbers.length > 0) formatted += ' (' + numbers.slice(0, 2);
        if (numbers.length > 2) formatted += ') ' + numbers.slice(2, 5);
        if (numbers.length > 5) formatted += '-' + numbers.slice(5, 7);
        if (numbers.length > 7) formatted += '-' + numbers.slice(7, 9);
        return formatted;
    };

    const handleChange = (e) => {
        let { name, value } = e.target;
        if (name === 'phone') {
            value = (value.length < 4 && formData.phone.startsWith('+998')) ? '' : formatPhoneNumber(value);
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const sendTelegramMessage = async (message) => {
        const botToken = '8448025655:AAFe_51EXWMPLpS388c1daw5Fhj7NThH_6k';
        const chatId = '6483456664';
        try {
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' })
            });
        } catch (err) { console.error('Error:', err); throw err; }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const telegramMessage = `
<b>${t.contact.title}!</b>
<b>${t.contact.labels.name}:</b> ${formData.name}
<b>${t.contact.labels.phone}:</b> ${formData.phone}
<b>${t.status.course}:</b> ${formData.course}
<b>${t.contact.labels.message}:</b> ${formData.message}
        `;
        try {
            await sendTelegramMessage(telegramMessage);
            setNotification({
                show: true,
                type: 'success',
                message: t.language === 'uz' ? 'Xabaringiz muvaffaqiyatli yuborildi!' : 'Your message has been sent successfully!'
            });
            setFormData({ name: '', phone: '', course: coursesData[0]?.title || '', message: '' });
        } catch (error) {
            setNotification({
                show: true,
                type: 'error',
                message: t.language === 'uz' ? 'Xatolik yuz berdi.' : 'An error occurred.'
            });
        } finally { setIsSubmitting(false); }
    };

    return (
        <div className="contact-page" style={containerStyle}>
            {notification.show && (
                <div style={{ ...toastStyle, backgroundColor: notification.type === 'success' ? '#10b981' : '#ef4444' }}>
                    {notification.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
                    <span>{notification.message}</span>
                    <button onClick={() => setNotification({ ...notification, show: false })} style={closeToast}><FaTimes /></button>
                </div>
            )}

            <h1 style={pageTitle}>{t.contact.title}</h1>

            <div style={gridStyle}>
                <div className="contact-info-panel">
                    <h2 style={sectionTitle}>{t.footer.contactInfo}</h2>
                    <div style={infoList}>
                        <InfoItem icon={<FaPhone />} label={t.contact.labels.phone} value={t.footer.phone} />
                        <InfoItem icon={<FaEnvelope />} label={t.contact.labels.email} value={t.footer.email} />
                        <InfoItem icon={<FaMapMarkerAlt />} label={t.contact.labels.office} value={t.footer.address} />
                    </div>
                </div>

                <div className="contact-form-panel">
                    <h2 style={sectionTitle}>{t.contact.labels.send}</h2>
                    <form onSubmit={handleSubmit} style={formStyle}>
                        <FormInput label={t.contact.labels.name} name="name" value={formData.name} onChange={handleChange} required />
                        <FormInput label={t.contact.labels.phone} name="phone" value={formData.phone} onChange={handleChange} required type="tel" placeholder="+998 (90) 123-45-67" />

                        <div style={inputGroup}>
                            <label style={labelStyle}>{t.status.course}</label>
                            <select name="course" value={formData.course} onChange={handleChange} style={inputStyle}>
                                {coursesData.map(c => <option key={c.id} value={c.title}>{c.title}</option>)}
                            </select>
                        </div>

                        <div style={inputGroup}>
                            <label style={labelStyle}>{t.contact.labels.message}</label>
                            <textarea name="message" value={formData.message} onChange={handleChange} rows="4" style={{ ...inputStyle, resize: 'vertical' }} required />
                        </div>

                        <button type="submit" disabled={isSubmitting} style={submitBtn}>
                            {isSubmitting ? '...' : <><FaPaperPlane /> {t.contact.labels.send}</>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

const InfoItem = ({ icon, label, value }) => (
    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={iconBox}>{icon}</div>
        <div>
            <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-main)' }}>{label}</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{value}</p>
        </div>
    </div>
);

const FormInput = ({ label, ...props }) => (
    <div style={inputGroup}>
        <label style={labelStyle}>{label}</label>
        <input {...props} style={inputStyle} />
    </div>
);

// Styles
const containerStyle = { maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem' };
const pageTitle = { fontSize: '2.5rem', textAlign: 'center', color: 'var(--primary)', marginBottom: '3rem' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 1.5fr', gap: '3rem', backgroundColor: 'var(--bg-secondary)', padding: '3rem', borderRadius: '1rem' };
const sectionTitle = { fontSize: '1.5rem', color: 'var(--primary)', marginBottom: '2rem' };
const infoList = { display: 'flex', flexDirection: 'column' };
const iconBox = { backgroundColor: 'var(--accent)', padding: '0.75rem', borderRadius: '50%', color: 'var(--primary)', display: 'flex' };
const formStyle = { display: 'flex', flexDirection: 'column', gap: '1.5rem' };
const inputGroup = { display: 'flex', flexDirection: 'column', gap: '0.5rem' };
const labelStyle = { fontWeight: '600', color: 'var(--text-main)' };
const inputStyle = { padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' };
const submitBtn = { backgroundColor: 'var(--primary)', color: 'white', padding: '1rem', borderRadius: '0.5rem', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' };
const toastStyle = { position: 'fixed', top: '2rem', right: '2rem', padding: '1rem 2rem', borderRadius: '0.5rem', color: 'white', display: 'flex', alignItems: 'center', gap: '1rem', zIndex: 1000 };
const closeToast = { background: 'none', border: 'none', color: 'white', cursor: 'pointer' };

export default Contact;