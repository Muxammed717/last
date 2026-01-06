import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { mockStudents as initialStudents } from '../data/students';
import { coursesData } from '../data/courses';
import { FaPlus, FaTrash, FaEdit, FaSave, FaTimes, FaSignOutAlt, FaHistory, FaCheckCircle, FaPrint, FaUsers, FaChalkboardTeacher } from 'react-icons/fa';

const AdminDashboard = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [groups, setGroups] = useState([]);
    const [paymentHistory, setPaymentHistory] = useState([]);

    const [activeTab, setActiveTab] = useState('students'); // 'students', 'groups', or 'search'
    const [filterGroup, setFilterGroup] = useState('all');
    const [isAdding, setIsAdding] = useState(false);
    const [isAddingGroup, setIsAddingGroup] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editingGroupId, setEditingGroupId] = useState(null);
    const [formData, setFormData] = useState({ name: '', groupId: '' });
    const [groupFormData, setGroupFormData] = useState({ name: '', courseId: '', teacherName: '' });

    // Status Search states
    const [searchId, setSearchId] = useState('');
    const [searchResult, setSearchResult] = useState(null);
    const [searchError, setSearchError] = useState(false);

    const [paymentModal, setPaymentModal] = useState({ show: false, id: null, amount: '500000', studentName: '' });
    const [receiptModal, setReceiptModal] = useState({ show: false, receipt: null });
    const [historyModal, setHistoryModal] = useState({ show: false, studentId: null });
    const [deleteModal, setDeleteModal] = useState({ show: false, id: null, type: 'student' });

    useEffect(() => {
        const session = localStorage.getItem('adminSession');
        if (!session) { navigate('/admin'); return; }

        // Load Students
        const storedStudents = localStorage.getItem('datasite_students');
        if (storedStudents) {
            setStudents(JSON.parse(storedStudents));
        } else {
            setStudents(initialStudents);
            localStorage.setItem('datasite_students', JSON.stringify(initialStudents));
        }

        // Load Groups
        const storedGroups = localStorage.getItem('datasite_groups');
        if (storedGroups) {
            setGroups(JSON.parse(storedGroups));
        } else {
            // Default groups from coursesData if none exist
            const initialGroups = coursesData.map(c => ({
                id: `GRP${c.id}`,
                name: `${c.title} - ${c.instructor}`,
                courseId: c.id,
                courseTitle: c.title,
                teacherName: c.instructor,
                revenue: 0
            }));
            setGroups(initialGroups);
            localStorage.setItem('datasite_groups', JSON.stringify(initialGroups));
        }

        // Load History
        const storedHistory = localStorage.getItem('datasite_history');
        if (storedHistory) setPaymentHistory(JSON.parse(storedHistory));
    }, [navigate]);

    const saveStudents = (updated) => {
        setStudents(updated);
        localStorage.setItem('datasite_students', JSON.stringify(updated));
    };

    const saveGroups = (updated) => {
        setGroups(updated);
        localStorage.setItem('datasite_groups', JSON.stringify(updated));
    };

    const saveHistory = (newEntry) => {
        const updated = [newEntry, ...paymentHistory];
        setPaymentHistory(updated);
        localStorage.setItem('datasite_history', JSON.stringify(updated));

        // Update group revenue
        const student = students.find(s => s.id === newEntry.studentId);
        if (student && student.groupId) {
            const updatedGroups = groups.map(g =>
                g.id === student.groupId ? { ...g, revenue: (g.revenue || 0) + newEntry.amount } : g
            );
            saveGroups(updatedGroups);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminSession');
        navigate('/admin');
    };

    const generateId = (prefix = 'DS') => {
        const num = Math.floor(1000 + Math.random() * 9000);
        return `${prefix}${num}`;
    };

    const handleAddStudent = (e) => {
        e.preventDefault();
        const selectedGroup = groups.find(g => g.id === formData.groupId);
        const newStudent = {
            id: generateId(),
            name: formData.name,
            groupId: formData.groupId,
            course: selectedGroup ? selectedGroup.courseTitle : '',
            status: 'unpaid',
            totalPaid: 0
        };
        saveStudents([...students, newStudent]);
        setIsAdding(false);
        setFormData({ name: '', groupId: '' });
    };

    const startEditStudent = (student) => {
        setEditingId(student.id);
        setFormData({ name: student.name, groupId: student.groupId });
        setIsAdding(true);
    };

    const handleUpdateStudent = (e) => {
        e.preventDefault();
        const selectedGroup = groups.find(g => g.id === formData.groupId);
        const updated = students.map(s => s.id === editingId ? {
            ...s,
            name: formData.name,
            groupId: formData.groupId,
            course: selectedGroup ? selectedGroup.courseTitle : s.course
        } : s);
        saveStudents(updated);
        setEditingId(null);
        setIsAdding(false);
        setFormData({ name: '', groupId: '' });
    };

    const handleAddGroup = (e) => {
        e.preventDefault();
        const course = coursesData.find(c => c.id === parseInt(groupFormData.courseId));
        const newGroup = {
            id: generateId('GRP'),
            name: groupFormData.name || `${course.title} - ${groupFormData.teacherName}`,
            courseId: course.id,
            courseTitle: course.title,
            teacherName: groupFormData.teacherName,
            revenue: 0
        };
        saveGroups([...groups, newGroup]);
        setIsAddingGroup(false);
        setGroupFormData({ name: '', courseId: '', teacherName: '' });
    };

    const handleMarkPaid = (id, name) => {
        setPaymentModal({ show: true, id: id, amount: '500000', studentName: name });
    };

    const startEditGroup = (group) => {
        setEditingGroupId(group.id);
        setGroupFormData({ name: group.name, courseId: group.courseId, teacherName: group.teacherName });
        setIsAddingGroup(true);
    };

    const handleUpdateGroup = (e) => {
        e.preventDefault();
        const updated = groups.map(g => g.id === editingGroupId ? { ...g, ...groupFormData } : g);
        saveGroups(updated);
        setEditingGroupId(null);
        setGroupFormData({ name: '', courseId: '', teacherName: '' });
        setIsAddingGroup(false);
    };

    const confirmPayment = () => {
        const amount = parseInt(paymentModal.amount.toString().replace(/\D/g, '')) || 0;
        const today = new Date().toISOString().split('T')[0];

        let studentRef = null;
        const updatedStudents = students.map(s => {
            if (s.id === paymentModal.id) {
                studentRef = { ...s, status: 'paid', lastPayment: today, totalPaid: (s.totalPaid || 0) + amount };
                return studentRef;
            }
            return s;
        });
        saveStudents(updatedStudents);

        const receipt = {
            id: `REC${Date.now()}`,
            studentId: paymentModal.id,
            studentName: paymentModal.studentName,
            amount: amount,
            date: today,
            course: studentRef.course
        };
        saveHistory(receipt);
        setPaymentModal({ show: false, id: null, amount: '500000', studentName: '' });
        setReceiptModal({ show: true, receipt: receipt });
    };

    const filteredStudents = filterGroup === 'all'
        ? students
        : students.filter(s => s.groupId === filterGroup);

    return (
        <div className="page admin-dashboard" style={{ padding: '2rem 0' }}>
            <div className="container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 900 }}>{t.admin.dashboardTitle}</h1>
                    <button className="btn btn-outline" onClick={handleLogout}><FaSignOutAlt /> Logout</button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                    <button
                        onClick={() => setActiveTab('students')}
                        style={{ ...tabBtn, borderBottom: activeTab === 'students' ? '3px solid var(--primary)' : 'none', color: activeTab === 'students' ? 'var(--primary)' : 'var(--text-secondary)' }}
                    >
                        <FaUsers /> {t.admin.studentHistory}
                    </button>
                    <button
                        onClick={() => setActiveTab('groups')}
                        style={{ ...tabBtn, borderBottom: activeTab === 'groups' ? '3px solid var(--primary)' : 'none', color: activeTab === 'groups' ? 'var(--primary)' : 'var(--text-secondary)' }}
                    >
                        <FaChalkboardTeacher /> {t.admin.groups}
                    </button>
                    <button
                        onClick={() => setActiveTab('search')}
                        style={{ ...tabBtn, borderBottom: activeTab === 'search' ? '3px solid var(--primary)' : 'none', color: activeTab === 'search' ? 'var(--primary)' : 'var(--text-secondary)' }}
                    >
                        <FaUsers /> {t.nav.status}
                    </button>
                </div>

                {activeTab === 'students' ? (
                    <>
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button className="btn btn-primary" onClick={() => setIsAdding(true)}><FaPlus /> {t.admin.addStudent}</button>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: '#1e293b', padding: '0.6rem 1.25rem', borderRadius: '1rem', border: '1px solid #334155', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <FaChalkboardTeacher style={{ color: 'var(--primary)', fontSize: '1.1rem' }} />
                                    <select value={filterGroup} onChange={e => setFilterGroup(e.target.value)} style={{ ...inputStyle, padding: '0', border: 'none', backgroundColor: 'transparent', fontWeight: 700, minWidth: '180px', color: 'white', cursor: 'pointer' }}>
                                        <option value="all" style={{ backgroundColor: '#1e293b' }}>{t.courses.filter.all} Guruhlar</option>
                                        {groups.map(g => <option key={g.id} value={g.id} style={{ backgroundColor: '#1e293b' }}>{g.name}</option>)}
                                    </select>
                                </div>
                                {filterGroup !== 'all' && (
                                    <div style={{ display: 'flex', gap: '1rem', borderLeft: '1px solid #334155', paddingLeft: '1.25rem', fontSize: '0.85rem' }}>
                                        <div style={{ textAlign: 'center' }}><div style={{ color: '#94a3b8', fontSize: '0.65rem', fontWeight: 800 }}>TOTAL</div><div style={{ fontWeight: 900 }}>{filteredStudents.length}</div></div>
                                        <div style={{ textAlign: 'center' }}><div style={{ color: '#94a3b8', fontSize: '0.65rem', fontWeight: 800 }}>PAID</div><div style={{ color: '#10b981', fontWeight: 900 }}>{filteredStudents.filter(s => s.status === 'paid').length}</div></div>
                                        <div style={{ textAlign: 'center' }}><div style={{ color: '#94a3b8', fontSize: '0.65rem', fontWeight: 800 }}>UNPAID</div><div style={{ color: '#EF4444', fontWeight: 900 }}>{filteredStudents.filter(s => s.status !== 'paid').length}</div></div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {isAdding && (
                            <div style={formBox}>
                                <h2>{editingId ? t.admin.editStudent : t.admin.addStudent}</h2>
                                <form onSubmit={editingId ? handleUpdateStudent : handleAddStudent} style={formGrid}>
                                    <input placeholder={t.admin.name} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required style={inputStyle} />
                                    <select value={formData.groupId} onChange={e => setFormData({ ...formData, groupId: e.target.value })} required style={inputStyle}>
                                        <option value="">{t.admin.groups}...</option>
                                        {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                    </select>
                                    <div style={{ display: 'flex', gap: '1rem', gridColumn: '1 / -1' }}>
                                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{t.admin.saveBtn}</button>
                                        <button type="button" className="btn btn-outline" onClick={() => { setIsAdding(false); setEditingId(null); setFormData({ name: '', groupId: '' }); }} style={{ flex: 1 }}>{t.admin.cancelBtn}</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        <div style={{ overflowX: 'auto' }}>
                            <table style={tableStyle}>
                                <thead>
                                    <tr style={{ backgroundColor: 'var(--bg-secondary)', textAlign: 'left' }}>
                                        <th style={thStyle}>{t.admin.id}</th>
                                        <th style={thStyle}>{t.admin.name}</th>
                                        <th style={thStyle}>{t.admin.course}</th>
                                        <th style={thStyle}>{t.admin.status}</th>
                                        <th style={thStyle}>{t.admin.actions}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.map(student => (
                                        <tr key={student.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={tdStyle}>{student.id}</td>
                                            <td style={tdStyle}>{student.name}</td>
                                            <td style={tdStyle}>{student.course}</td>
                                            <td style={tdStyle}>
                                                <span style={{
                                                    padding: '0.25rem 0.5rem', borderRadius: '0.5rem', fontSize: '0.7rem', fontWeight: 800,
                                                    backgroundColor: student.status === 'paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                    color: student.status === 'paid' ? '#10B981' : '#EF4444'
                                                }}>
                                                    {student.status === 'paid' ? t.status.paid : t.status.unpaid}
                                                </span>
                                            </td>
                                            <td style={tdStyle}>
                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                    <button onClick={() => handleMarkPaid(student.id, student.name)} style={payBtnStyle}>{t.admin.markPaid}</button>
                                                    <button onClick={() => startEditStudent(student)} style={{ ...actionBtnStyle, color: 'var(--text-secondary)' }} title={t.admin.editStudent}><FaEdit /></button>
                                                    <button onClick={() => setHistoryModal({ show: true, studentId: student.id })} style={histBtnStyle} title={t.admin.history}><FaHistory /></button>
                                                    <button onClick={() => setDeleteModal({ show: true, id: student.id, type: 'student' })} style={{ ...actionBtnStyle, color: '#EF4444' }}><FaTrash /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : activeTab === 'groups' ? (
                    <>
                        <div style={{ marginBottom: '2rem' }}>
                            {!isAddingGroup && <button className="btn btn-primary" onClick={() => setIsAddingGroup(true)}><FaPlus /> {t.admin.addGroup}</button>}
                        </div>

                        {isAddingGroup && (
                            <div style={formBox}>
                                <h2>{editingGroupId ? t.admin.editStudent : t.admin.addGroup}</h2>
                                <form onSubmit={editingGroupId ? handleUpdateGroup : handleAddGroup} style={formGrid}>
                                    <input placeholder={t.admin.groupName} value={groupFormData.name} onChange={e => setGroupFormData({ ...groupFormData, name: e.target.value })} style={inputStyle} />
                                    <select value={groupFormData.courseId} onChange={e => setGroupFormData({ ...groupFormData, courseId: e.target.value })} required style={inputStyle}>
                                        <option value="">{t.admin.course}...</option>
                                        {coursesData.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                    </select>
                                    <input placeholder={t.admin.teacher} value={groupFormData.teacherName} onChange={e => setGroupFormData({ ...groupFormData, teacherName: e.target.value })} required style={inputStyle} />
                                    <div style={{ display: 'flex', gap: '1rem', gridColumn: '1 / -1' }}>
                                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{t.admin.saveBtn}</button>
                                        <button type="button" className="btn btn-outline" onClick={() => { setIsAddingGroup(false); setEditingGroupId(null); setGroupFormData({ name: '', courseId: '', teacherName: '' }); }} style={{ flex: 1 }}>{t.admin.cancelBtn}</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        <div style={{ overflowX: 'auto' }}>
                            <table style={tableStyle}>
                                <thead>
                                    <tr style={{ backgroundColor: 'var(--bg-secondary)', textAlign: 'left' }}>
                                        <th style={thStyle}>{t.admin.groupName}</th>
                                        <th style={thStyle}>{t.admin.course}</th>
                                        <th style={thStyle}>{t.admin.teacher}</th>
                                        <th style={thStyle}>{t.admin.groupStudents}</th>
                                        <th style={thStyle}>{t.admin.groupRevenue}</th>
                                        <th style={thStyle}>{t.admin.actions}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {groups.map(group => (
                                        <tr key={group.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ ...tdStyle, fontWeight: 700 }}>{group.name}</td>
                                            <td style={tdStyle}>{group.courseTitle}</td>
                                            <td style={tdStyle}>{group.teacherName}</td>
                                            <td style={tdStyle}>{students.filter(s => s.groupId === group.id).length}</td>
                                            <td style={{ ...tdStyle, color: '#10b981', fontWeight: 700 }}>{new Intl.NumberFormat('uz-UZ').format(group.revenue || 0)}</td>
                                            <td style={tdStyle}>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button onClick={() => startEditGroup(group)} style={{ ...actionBtnStyle, color: 'var(--text-secondary)' }}><FaEdit /></button>
                                                    <button onClick={() => setDeleteModal({ show: true, id: group.id, type: 'group' })} style={{ ...actionBtnStyle, color: '#EF4444' }}><FaTrash /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <div style={formBox}>
                            <h2 style={{ marginBottom: '1.5rem' }}>{t.status?.title || 'Student Status'}</h2>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <input
                                    placeholder="Enter ID (e.g. DS2025)"
                                    value={searchId}
                                    onChange={e => { setSearchId(e.target.value); setSearchError(false); }}
                                    style={{ ...inputStyle, flex: 1 }}
                                />
                                <button
                                    className="btn btn-primary"
                                    onClick={() => {
                                        const found = students.find(s => s.id === searchId.toUpperCase());
                                        if (found) {
                                            setSearchResult(found);
                                            setSearchError(false);
                                        } else {
                                            setSearchResult(null);
                                            setSearchError(true);
                                        }
                                    }}
                                >
                                    Search
                                </button>
                            </div>

                            {searchError && (
                                <div style={{ color: '#EF4444', marginTop: '1rem', textAlign: 'center', fontWeight: 700 }}>
                                    Student not found!
                                </div>
                            )}
                        </div>

                        {searchResult && (
                            <div style={{ ...formBox, animation: 'fadeIn 0.3s ease' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.5rem', fontWeight: 900 }}>{searchResult.name}</h3>
                                        <p style={{ color: 'var(--primary)', fontWeight: 700 }}>{searchResult.id}</p>
                                    </div>
                                    <span style={{
                                        padding: '0.5rem 1rem', borderRadius: '2rem', height: 'fit-content',
                                        backgroundColor: searchResult.status === 'paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        color: searchResult.status === 'paid' ? '#10B981' : '#EF4444',
                                        fontWeight: 800
                                    }}>
                                        {searchResult.status === 'paid' ? t.status.paid : t.status.unpaid}
                                    </span>
                                </div>

                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Course:</span>
                                        <span style={{ fontWeight: 700 }}>{searchResult.course}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Last Payment:</span>
                                        <span style={{ fontWeight: 700 }}>{searchResult.lastPayment || '—'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Next Payment:</span>
                                        <span style={{ fontWeight: 700 }}>{searchResult.nextPayment || '—'}</span>
                                    </div>
                                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Total Paid:</span>
                                        <span style={{ fontWeight: 900, color: '#10b981' }}>{new Intl.NumberFormat('uz-UZ').format(searchResult.totalPaid || 0)} UZS</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Student History Modal */}
                {historyModal.show && (
                    <div className="modal-overlay" style={modalOverlayStyle}>
                        <div className="modal-content" style={{ ...modalContentStyle, maxWidth: '600px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                <h3 style={{ fontWeight: 900 }}>{t.admin.studentHistory}</h3>
                                <button onClick={() => setHistoryModal({ show: false, studentId: null })} style={closeBtn}><FaTimes /></button>
                            </div>
                            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--bg-main)' }}>
                                        <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                                            <th style={{ padding: '0.75rem' }}>{t.admin.date}</th>
                                            <th style={{ padding: '0.75rem' }}>{t.admin.amount}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paymentHistory.filter(h => h.studentId === historyModal.studentId).map(h => (
                                            <tr key={h.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={{ padding: '0.75rem' }}>{h.date}</td>
                                                <td style={{ padding: '0.75rem', fontWeight: 700, color: '#10b981' }}>{new Intl.NumberFormat('uz-UZ').format(h.amount)}</td>
                                            </tr>
                                        ))}
                                        {paymentHistory.filter(h => h.studentId === historyModal.studentId).length === 0 && (
                                            <tr><td colSpan="2" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>To'lovlar topilmadi</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Reuse existing Payment & Receipt Modals logic... */}
                {paymentModal.show && (
                    <div className="modal-overlay" style={modalOverlayStyle}>
                        <div className="modal-content" style={modalContentStyle}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>{t.admin.markPaid}</h3>
                            <p style={{ color: '#64748b', marginBottom: '2rem' }}>{paymentModal.studentName}</p>
                            <div style={{ position: 'relative', marginBottom: '2.5rem' }}>
                                <input type="text" autoFocus value={new Intl.NumberFormat('uz-UZ').format(paymentModal.amount)} onChange={e => setPaymentModal({ ...paymentModal, amount: e.target.value.replace(/\D/g, '') })} style={amountInputStyle} />
                                <span style={currencyLabel}>UZS</span>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button onClick={() => setPaymentModal({ show: false, id: null, amount: '500000', studentName: '' })} className="btn btn-outline" style={{ flex: 1 }}>{t.admin.cancelBtn}</button>
                                <button onClick={confirmPayment} className="btn btn-primary" style={{ flex: 1, backgroundColor: '#10b981' }}>{t.admin.saveBtn}</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Receipt Modal */}
                {receiptModal.show && (
                    <div className="modal-overlay" style={modalOverlayStyle}>
                        <div className="modal-content receipt-card" style={{ ...modalContentStyle, maxWidth: '400px', textAlign: 'center' }}>
                            <div style={{ color: '#10b981', fontSize: '3rem', marginBottom: '1rem' }}><FaCheckCircle /></div>
                            <h2 style={{ marginBottom: '1rem' }}>{t.admin.receipt}</h2>
                            <div style={receiptDetailBox}>
                                <div style={receiptRow}><span>{t.admin.id}:</span> <strong>{receiptModal.receipt.studentId}</strong></div>
                                <div style={receiptRow}><span>{t.admin.name}:</span> <strong>{receiptModal.receipt.studentName}</strong></div>
                                <div style={receiptRow}><span>{t.admin.course}:</span> <strong>{receiptModal.receipt.course}</strong></div>
                                <div style={receiptRow}><span>{t.admin.amount}:</span> <strong style={{ color: '#10b981' }}>{new Intl.NumberFormat('uz-UZ').format(receiptModal.receipt.amount)} UZS</strong></div>
                                <div style={receiptRow}><span>{t.admin.date}:</span> <strong>{receiptModal.receipt.date}</strong></div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button onClick={() => window.print()} className="btn btn-outline" style={{ flex: 1 }}><FaPrint /> {t.admin.print}</button>
                                <button onClick={() => setReceiptModal({ show: false, receipt: null })} className="btn btn-primary" style={{ flex: 1 }}>{t.admin.close}</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Custom Delete Modal */}
                {deleteModal.show && (
                    <div className="modal-overlay" style={modalOverlayStyle}>
                        <div className="modal-content" style={{ ...modalContentStyle, maxWidth: '400px', textAlign: 'center' }}>
                            <div style={{ color: '#EF4444', fontSize: '3rem', marginBottom: '1rem' }}><FaTrash /></div>
                            <h3>{t.admin.confirmDelete}</h3>
                            <p style={{ margin: '1rem 0 2rem', color: 'var(--text-secondary)' }}>{t.admin.deleteWarning}</p>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button onClick={() => setDeleteModal({ show: false })} className="btn btn-outline" style={{ flex: 1 }}>{t.admin.cancelBtn}</button>
                                <button onClick={() => {
                                    if (deleteModal.type === 'student') {
                                        saveStudents(students.filter(s => s.id !== deleteModal.id));
                                    } else {
                                        saveGroups(groups.filter(g => g.id !== deleteModal.id));
                                    }
                                    setDeleteModal({ show: false });
                                }} className="btn btn-primary" style={{ flex: 1, backgroundColor: '#EF4444' }}>{t.admin.deleteStudent}</button>
                            </div>
                        </div>
                    </div>
                )}

                <style>{`
                    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; animation: fadeIn 0.2s; }
                    .modal-content { background: var(--bg-main); border-radius: 1.5rem; padding: 2rem; width: 100%; max-width: 500px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); border: 1px solid var(--border); animation: slideUp 0.3s cubic-bezier(0.19, 1, 0.22, 1); }
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                    @media print { body * { visibility: hidden; } .receipt-card, .receipt-card * { visibility: visible; } .receipt-card { position: absolute; left: 0; top: 0; width: 100%; border: none; box-shadow: none; } .btn { display: none; } }
                `}</style>
            </div>
        </div>
    );
};

// Styles
const tabBtn = { background: 'none', border: 'none', padding: '0.75rem 1.5rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: '0.2s' };
const formBox = { backgroundColor: 'var(--bg-secondary)', padding: '2rem', borderRadius: 'var(--radius-lg)', marginBottom: '3rem', border: '1px solid var(--border)' };
const formGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' };
const inputStyle = { padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' };
const thStyle = { padding: '1rem', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' };
const tdStyle = { padding: '1rem', fontSize: '0.85rem' };
const payBtnStyle = { padding: '0.4rem 0.8rem', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '0.5rem', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' };
const histBtnStyle = { background: '#1e293b', color: 'white', border: 'none', padding: '0.4rem 0.6rem', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center' };
const actionBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: '1rem', display: 'flex', alignItems: 'center' };
const groupCard = { backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', transition: '0.3s' };
const groupDetail = { display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' };
const modalOverlayStyle = { position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' };
const modalContentStyle = { backgroundColor: 'var(--bg-main)', borderRadius: '1.5rem', padding: '2rem', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', border: '1px solid var(--border)' };
const amountInputStyle = { width: '100%', padding: '1rem', fontSize: '1.5rem', fontWeight: 800, textAlign: 'center', border: '1px solid var(--border)', borderRadius: '1rem', color: '#10b981', backgroundColor: 'var(--bg-secondary)', outline: 'none' };
const currencyLabel = { position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#94a3b8' };
const closeBtn = { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--text-secondary)' };
const receiptDetailBox = { backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '1rem', textAlign: 'left', marginTop: '1rem' };
const receiptRow = { display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px dashed var(--border)' };

const handleMarkPaid = (id, name, setPaymentModal) => {
    // This is handled inside the component now but kept for consistency if needed
};

export default AdminDashboard;
