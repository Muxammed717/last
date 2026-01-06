// Bu yerda barcha o'quvchilar ro'yxati saqlanadi.
// Yangi o'quvchi qo'shish uchun ro'yxatga yangi obyekt qo'shing.

// ID berish bo'yicha tavsiya: DS + YIL + TARTIB RAQAMI (Masalan: DS2025001)

export const mockStudents = [
    {
        id: 'DS2025',
        name: 'Abdullayev Botir',
        course: 'Frontend React Bootcamp',
        status: 'paid',
        lastPayment: '2024-12-15',
        nextPayment: '2025-01-15',
        totalPaid: 1500000
    },
    {
        id: 'DS2026',
        name: 'Karimov Sardor',
        course: 'Python Backend Mastery',
        status: 'unpaid',
        lastPayment: '2024-11-20',
        nextPayment: '2024-12-20',
        totalPaid: 500000
    },
    {
        id: 'DS2027',
        name: 'Tursunova Malika',
        course: 'UI/UX Design',
        status: 'pending',
        lastPayment: '2024-11-25',
        nextPayment: '2024-12-25',
        totalPaid: 2000000
    },
    {
        id: 'DS2028',
        name: 'Azimov Javohir',
        course: 'Flutter Mobile Dev',
        status: 'paid',
        lastPayment: '2024-12-01',
        nextPayment: '2025-01-01',
        totalPaid: 3000000
    },
    {
        id: 'DS2029',
        name: 'Saidova Nigora',
        course: 'Frontend React Bootcamp',
        status: 'unpaid',
        lastPayment: '2024-10-10',
        nextPayment: '2024-11-10',
        totalPaid: 0
    }
];
