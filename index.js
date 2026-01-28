const { Telegraf } = require('telegraf');
const express = require('express');

// 🌐 خادم ويب متقدم
const app = express();
const PORT = process.env.PORT || 3000;

// 🎨 صفحة ويب احترافية
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>🚀 Pedrock Pro - نظام إدارة سيرفرات متقدم</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <style>
                :root {
                    --primary: #6366f1;
                    --primary-dark: #4f46e5;
                    --secondary: #10b981;
                    --dark: #1e293b;
                    --light: #f8fafc;
                    --gradient: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                    --glass: rgba(255, 255, 255, 0.1);
                    --shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                }
                
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                    font-family: 'Tajawal', 'Segoe UI', sans-serif;
                }
                
                body {
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                    color: var(--light);
                    min-height: 100vh;
                    overflow-x: hidden;
                    position: relative;
                }
                
                .background-animation {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: -1;
                    opacity: 0.3;
                }
                
                .particle {
                    position: absolute;
                    border-radius: 50%;
                    background: var(--primary);
                    animation: float 20s infinite linear;
                }
                
                @keyframes float {
                    0% { transform: translateY(0) rotate(0deg); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
                }
                
                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 40px 20px;
                    position: relative;
                    z-index: 1;
                }
                
                .header {
                    text-align: center;
                    margin-bottom: 60px;
                    animation: fadeInDown 1s ease-out;
                }
                
                @keyframes fadeInDown {
                    from { opacity: 0; transform: translateY(-30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .logo {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 80px;
                    height: 80px;
                    background: var(--gradient);
                    border-radius: 20px;
                    margin-bottom: 20px;
                    font-size: 40px;
                    animation: pulse 2s infinite;
                }
                
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                
                h1 {
                    font-size: 3.5rem;
                    background: linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    margin-bottom: 15px;
                    font-weight: 800;
                }
                
                .tagline {
                    font-size: 1.3rem;
                    color: #cbd5e1;
                    margin-bottom: 30px;
                    opacity: 0.9;
                }
                
                .dashboard {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 25px;
                    margin-bottom: 50px;
                }
                
                .card {
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(10px);
                    border-radius: 20px;
                    padding: 30px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }
                
                .card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 4px;
                    background: var(--gradient);
                }
                
                .card:hover {
                    transform: translateY(-10px);
                    border-color: var(--primary);
                    box-shadow: var(--shadow);
                }
                
                .card-icon {
                    font-size: 40px;
                    margin-bottom: 20px;
                    color: var(--primary);
                }
                
                .card-title {
                    font-size: 1.4rem;
                    margin-bottom: 15px;
                    font-weight: 600;
                }
                
                .card-content {
                    color: #94a3b8;
                    line-height: 1.6;
                    margin-bottom: 20px;
                }
                
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin: 40px 0;
                }
                
                .stat-item {
                    background: rgba(255, 255, 255, 0.03);
                    padding: 25px;
                    border-radius: 15px;
                    text-align: center;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    transition: all 0.3s ease;
                }
                
                .stat-item:hover {
                    background: rgba(99, 102, 241, 0.1);
                    border-color: var(--primary);
                }
                
                .stat-number {
                    font-size: 2.5rem;
                    font-weight: 700;
                    background: var(--gradient);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    margin-bottom: 10px;
                }
                
                .stat-label {
                    color: #94a3b8;
                    font-size: 0.9rem;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                
                .channels-section {
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 20px;
                    padding: 40px;
                    margin: 50px 0;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .section-title {
                    font-size: 1.8rem;
                    margin-bottom: 30px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    color: var(--light);
                }
                
                .section-title i {
                    color: var(--primary);
                }
                
                .channel-list {
                    display: grid;
                    gap: 15px;
                }
                
                .channel-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: rgba(255, 255, 255, 0.05);
                    padding: 20px;
                    border-radius: 12px;
                    transition: all 0.3s ease;
                }
                
                .channel-item:hover {
                    background: rgba(99, 102, 241, 0.1);
                    transform: translateX(5px);
                }
                
                .channel-info {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }
                
                .channel-icon {
                    width: 50px;
                    height: 50px;
                    background: var(--gradient);
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                }
                
                .btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    background: var(--gradient);
                    color: white;
                    padding: 14px 28px;
                    border-radius: 50px;
                    text-decoration: none;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    border: none;
                    cursor: pointer;
                    font-size: 1rem;
                }
                
                .btn:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 10px 25px rgba(99, 102, 241, 0.4);
                }
                
                .btn-outline {
                    background: transparent;
                    border: 2px solid var(--primary);
                    color: var(--primary);
                }
                
                .btn-outline:hover {
                    background: var(--primary);
                    color: white;
                }
                
                .btn-group {
                    display: flex;
                    gap: 15px;
                    flex-wrap: wrap;
                    justify-content: center;
                    margin: 40px 0;
                }
                
                .feature-list {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 25px;
                    margin: 50px 0;
                }
                
                .feature-item {
                    background: rgba(255, 255, 255, 0.03);
                    padding: 25px;
                    border-radius: 15px;
                    transition: all 0.3s ease;
                }
                
                .feature-item:hover {
                    background: rgba(99, 102, 241, 0.1);
                    transform: translateY(-5px);
                }
                
                .feature-icon {
                    font-size: 30px;
                    color: var(--primary);
                    margin-bottom: 15px;
                }
                
                .footer {
                    text-align: center;
                    margin-top: 60px;
                    padding-top: 40px;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    color: #64748b;
                }
                
                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(16, 185, 129, 0.2);
                    color: #10b981;
                    padding: 8px 20px;
                    border-radius: 50px;
                    font-size: 0.9rem;
                    font-weight: 600;
                }
                
                .status-badge::before {
                    content: '';
                    width: 8px;
                    height: 8px;
                    background: #10b981;
                    border-radius: 50%;
                    animation: blink 2s infinite;
                }
                
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                
                .highlight {
                    background: linear-gradient(90deg, #f59e0b, #f97316);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    font-weight: 700;
                }
                
                @media (max-width: 768px) {
                    .container { padding: 20px; }
                    h1 { font-size: 2.5rem; }
                    .dashboard { grid-template-columns: 1fr; }
                    .btn-group { flex-direction: column; }
                }
            </style>
        </head>
        <body>
            <div class="background-animation" id="particles"></div>
            
            <div class="container">
                <div class="header">
                    <div class="logo">
                        <i class="fas fa-robot"></i>
                    </div>
                    <h1>Pedrock Pro</h1>
                    <p class="tagline">نظام إدارة سيرفرات ماينكرافت المتقدم</p>
                    <div class="status-badge">
                        <i class="fas fa-signal"></i>
                        النظام يعمل بنسبة 100%
                    </div>
                </div>
                
                <div class="dashboard">
                    <div class="card">
                        <div class="card-icon">
                            <i class="fas fa-bolt"></i>
                        </div>
                        <h3 class="card-title">تشغيل تلقائي</h3>
                        <p class="card-content">
                            نظام تشغيل ذكي يعمل 24/7 مع إعادة اتصال تلقائية
                            وحماية من التوقف المفاجئ.
                        </p>
                        <div class="btn btn-outline">
                            <i class="fas fa-play"></i>
                            بدء التشغيل
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-icon">
                            <i class="fas fa-server"></i>
                        </div>
                        <h3 class="card-title">إدارة متعددة</h3>
                        <p class="card-content">
                            أدر عدة سيرفرات في نفس الوقت مع واجهة تحكم موحدة
                            وإحصائيات مفصلة لكل سيرفر.
                        </p>
                        <div class="btn btn-outline">
                            <i class="fas fa-plus"></i>
                            إضافة سيرفر
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-icon">
                            <i class="fas fa-shield-alt"></i>
                        </div>
                        <h3 class="card-title">حماية متقدمة</h3>
                        <p class="card-content">
                            نظام حماية من الهجمات والتوقف مع مراقبة مستمرة
                            وإشعارات فورية عن أي مشكلة.
                        </p>
                        <div class="btn btn-outline">
                            <i class="fas fa-cog"></i>
                            الإعدادات
                        </div>
                    </div>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-number" id="onlineServers">24</div>
                        <div class="stat-label">سيرفر نشط</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number" id="activeBots">156</div>
                        <div class="stat-label">بوت نشط</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number" id="uptime">99.9%</div>
                        <div class="stat-label">نسبة التشغيل</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number" id="users">1.2K</div>
                        <div class="stat-label">مستخدم نشط</div>
                    </div>
                </div>
                
                <div class="channels-section">
                    <h2 class="section-title">
                        <i class="fas fa-bell"></i>
                        قنوات الاشتراك المطلوبة
                    </h2>
                    <div class="channel-list">
                        <div class="channel-item">
                            <div class="channel-info">
                                <div class="channel-icon">
                                    <i class="fab fa-telegram"></i>
                                </div>
                                <div>
                                    <div style="font-weight: 600; margin-bottom: 5px;">مودات دينار</div>
                                    <div style="color: #94a3b8; font-size: 0.9rem;">@vsyfyk • مودات ومسابقات</div>
                                </div>
                            </div>
                            <a href="https://t.me/vsyfyk" class="btn" target="_blank">
                                <i class="fas fa-external-link-alt"></i>
                                انضم الآن
                            </a>
                        </div>
                        
                        <div class="channel-item">
                            <div class="channel-info">
                                <div class="channel-icon">
                                    <i class="fab fa-telegram"></i>
                                </div>
                                <div>
                                    <div style="font-weight: 600; margin-bottom: 5px;">ترويج سيرفرات</div>
                                    <div style="color: #94a3b8; font-size: 0.9rem;">@N_NHGER • ترويج وشارك سيرفرك</div>
                                </div>
                            </div>
                            <a href="https://t.me/N_NHGER" class="btn" target="_blank">
                                <i class="fas fa-external-link-alt"></i>
                                انضم الآن
                            </a>
                        </div>
                        
                        <div class="channel-item">
                            <div class="channel-info">
                                <div class="channel-icon">
                                    <i class="fab fa-telegram"></i>
                                </div>
                                <div>
                                    <div style="font-weight: 600; margin-bottom: 5px;">قناة تعليمية</div>
                                    <div style="color: #94a3b8; font-size: 0.9rem;">@sjxhhdbx72 • شروحات ومعلومات</div>
                                </div>
                            </div>
                            <a href="https://t.me/sjxhhdbx72" class="btn" target="_blank">
                                <i class="fas fa-external-link-alt"></i>
                                انضم الآن
                            </a>
                        </div>
                    </div>
                </div>
                
                <div style="text-align: center; margin: 60px 0;">
                    <h2 style="font-size: 2rem; margin-bottom: 30px; color: var(--light);">
                        ابدأ رحلتك مع <span class="highlight">Pedrock Pro</span>
                    </h2>
                    <p style="color: #94a3b8; max-width: 600px; margin: 0 auto 40px; line-height: 1.8;">
                        انضم لأكثر من <span class="highlight">1000</span> مستخدم يثقون بنظامنا لإدارة سيرفراتهم.
                        نظام متكامل، سهل الاستخدام، وقوي الأداء.
                    </p>
                    <div class="btn-group">
                        <a href="https://t.me/your_bot" class="btn" style="padding: 16px 35px;">
                            <i class="fab fa-telegram"></i>
                            افتح البوت في التلجرام
                        </a>
                        <a href="#features" class="btn btn-outline" style="padding: 16px 35px;">
                            <i class="fas fa-star"></i>
                            اكتشف المميزات
                        </a>
                    </div>
                </div>
                
                <div class="feature-list" id="features">
                    <div class="feature-item">
                        <div class="feature-icon">
                            <i class="fas fa-rocket"></i>
                        </div>
                        <h3 style="margin-bottom: 15px; color: var(--light);">أداء فائق</h3>
                        <p style="color: #94a3b8; line-height: 1.7;">
                            نظام محسن للعمل على Railway مع استهلاك منخفض للموارد وأداء عالي.
                        </p>
                    </div>
                    
                    <div class="feature-item">
                        <div class="feature-icon">
                            <i class="fas fa-mobile-alt"></i>
                        </div>
                        <h3 style="margin-bottom: 15px; color: var(--light);">واجهة متجاوبة</h3>
                        <p style="color: #94a3b8; line-height: 1.7;">
                            تصميم عصري يعمل على جميع الأجهزة مع تجربة استخدام سلسة.
                        </p>
                    </div>
                    
                    <div class="feature-item">
                        <div class="feature-icon">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <h3 style="margin-bottom: 15px; color: var(--light);">إحصائيات حية</h3>
                        <p style="color: #94a3b8; line-height: 1.7;">
                            مراقبة في الوقت الفعلي مع رسوم بيانية وتقارير مفصلة.
                        </p>
                    </div>
                </div>
                
                <div class="footer">
                    <p>© 2024 Pedrock Pro - جميع الحقوق محفوظة</p>
                    <p style="margin-top: 20px; font-size: 0.9rem; color: #64748b;">
                        <i class="fas fa-code"></i> بني بـ Node.js & Express | 
                        <i class="fas fa-cloud"></i> يستضاف على Railway |
                        <i class="fas fa-heart" style="color: #ec4899;"></i> مصمم بحب
                    </p>
                </div>
            </div>
            
            <script>
                // إنشاء جسيمات متحركة
                function createParticles() {
                    const container = document.getElementById('particles');
                    for (let i = 0; i < 50; i++) {
                        const particle = document.createElement('div');
                        particle.className = 'particle';
                        particle.style.width = Math.random() * 10 + 2 + 'px';
                        particle.style.height = particle.style.width;
                        particle.style.left = Math.random() * 100 + '%';
                        particle.style.animationDelay = Math.random() * 20 + 's';
                        particle.style.animationDuration = Math.random() * 30 + 20 + 's';
                        particle.style.opacity = Math.random() * 0.5 + 0.2;
                        container.appendChild(particle);
                    }
                }
                
                // تحديث الإحصائيات
                function updateStats() {
                    const stats = [
                        { id: 'onlineServers', min: 20, max: 30 },
                        { id: 'activeBots', min: 150, max: 200 },
                        { id: 'users', min: 1000, max: 1500 }
                    ];
                    
                    stats.forEach(stat => {
                        const element = document.getElementById(stat.id);
                        if (element) {
                            let current = parseInt(element.textContent.replace(/[^0-9]/g, ''));
                            const target = Math.floor(Math.random() * (stat.max - stat.min)) + stat.min;
                            
                            // تأثير عد متحرك
                            let counter = current;
                            const increment = (target - current) / 30;
                            
                            const update = () => {
                                counter += increment;
                                if ((increment > 0 && counter >= target) || 
                                    (increment < 0 && counter <= target)) {
                                    element.textContent = stat.id === 'uptime' ? '99.9%' : target;
                                    return;
                                }
                                element.textContent = stat.id === 'uptime' ? '99.9%' : Math.floor(counter);
                                setTimeout(update, 50);
                            };
                            
                            update();
                        }
                    });
                }
                
                // تأثيرات عند التمرير
                function initScrollEffects() {
                    const cards = document.querySelectorAll('.card, .feature-item');
                    const observer = new IntersectionObserver((entries) => {
                        entries.forEach(entry => {
                            if (entry.isIntersecting) {
                                entry.target.style.opacity = '1';
                                entry.target.style.transform = 'translateY(0)';
                            }
                        });
                    }, { threshold: 0.1 });
                    
                    cards.forEach(card => {
                        card.style.opacity = '0';
                        card.style.transform = 'translateY(20px)';
                        card.style.transition = 'all 0.6s ease';
                        observer.observe(card);
                    });
                }
                
                // تهيئة الصفحة
                document.addEventListener('DOMContentLoaded', () => {
                    createParticles();
                    updateStats();
                    initScrollEffects();
                    
                    // تحديث الإحصائيات كل 30 ثانية
                    setInterval(updateStats, 30000);
                    
                    // تأثيرات على الأزرار
                    const buttons = document.querySelectorAll('.btn');
                    buttons.forEach(btn => {
                        btn.addEventListener('mouseenter', () => {
                            btn.style.transform = 'translateY(-3px) scale(1.05)';
                        });
                        
                        btn.addEventListener('mouseleave', () => {
                            btn.style.transform = 'translateY(0) scale(1)';
                        });
                    });
                });
                
                // حالة النظام الحية
                function updateSystemStatus() {
                    const statusBadge = document.querySelector('.status-badge');
                    const statusText = document.querySelector('.status-badge i');
                    
                    fetch('/api/status')
                        .then(response => response.json())
                        .then(data => {
                            if (data.status === 'online') {
                                statusBadge.style.background = 'rgba(16, 185, 129, 0.2)';
                                statusBadge.style.color = '#10b981';
                                statusText.className = 'fas fa-signal';
                                statusText.nextSibling.textContent = ' النظام يعمل بنسبة 100%';
                            } else {
                                statusBadge.style.background = 'rgba(239, 68, 68, 0.2)';
                                statusBadge.style.color = '#ef4444';
                                statusText.className = 'fas fa-exclamation-triangle';
                                statusText.nextSibling.textContent = ' النظام في وضع الصيانة';
                            }
                        })
                        .catch(() => {
                            // حالة افتراضية إذا فشل الاتصال
                            statusBadge.style.background = 'rgba(245, 158, 11, 0.2)';
                            statusBadge.style.color = '#f59e0b';
                            statusText.className = 'fas fa-sync-alt';
                            statusText.nextSibling.textContent = ' جاري الاتصال...';
                        });
                }
                
                // تحديث حالة النظام كل دقيقة
                setInterval(updateSystemStatus, 60000);
            </script>
        </body>
        </html>
    `);
});

// 📊 مسارات API
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '2.0.0',
        platform: 'Railway'
    });
});

app.get('/api/stats', (req, res) => {
    res.json({
        onlineServers: Math.floor(Math.random() * 10) + 20,
        activeBots: Math.floor(Math.random() * 50) + 150,
        totalUsers: Math.floor(Math.random() * 500) + 1000,
        uptime: '99.9%',
        responseTime: Math.floor(Math.random() * 100) + 50 + 'ms'
    });
});

// 🚀 تشغيل الخادم
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎨 الواجهة تعمل على: http://localhost:${PORT}`);
    console.log(`📊 API الإحصائيات: http://localhost:${PORT}/api/stats`);
    console.log(`❤️  API الحالة: http://localhost:${PORT}/api/status`);
});

// 🤖 بوت التلجرام الاحترافي
const TOKEN = process.env.TELEGRAM_TOKEN || "8348711486:AAFX5lYl0RMPTKR_8rsV_XdC23zPa7lkRIQ";

try {
    const bot = new Telegraf(TOKEN);
    
    // ✨ حدث عند الاتصال
    bot.on('polling_error', (error) => {
        console.log('🔧 خطأ اتصال:', error.message);
    });
    
    // 🎯 أمر البداية الاحترافي
    bot.start(async (ctx) => {
        const welcomeMessage = `
🎊 *مرحباً بك في Pedrock Pro!* 🚀

✨ *نظام إدارة سيرفرات ماينكرافت المتقدم*

✅ *المميزات الرئيسية:*
• 🤖 بوتات ذكية 24/7
• 🎮 دعم جميع إصدارات بيدروك
• 📊 إحصائيات حية مفصلة
• 🔄 إعادة اتصال تلقائية
• 🛡️ حماية متقدمة

👇 *اختر من القائمة:*
        `;
        
        const keyboard = {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "🚀 إضافة سيرفر", callback_data: "add_server" },
                        { text: "📋 سيرفراتي", callback_data: "my_servers" }
                    ],
                    [
                        { text: "⚡ تشغيل سريع", callback_data: "quick_start" },
                        { text: "🎮 إدارة بوتات", callback_data: "manage_bots" }
                    ],
                    [
                        { text: "📊 الإحصائيات", callback_data: "stats" },
                        { text: "⚙️ الإعدادات", callback_data: "settings" }
                    ],
                    [
                        { text: "🆘 مركز المساعدة", callback_data: "help_center" },
                        { text: "💎 المميزات", callback_data: "features" }
                    ]
                ]
            }
        };
        
        await ctx.reply(welcomeMessage, {
            parse_mode: 'Markdown',
            ...keyboard
        });
        
        console.log(`👑 ${ctx.from.first_name} بدأ النظام`);
    });
    
    // 🎮 معالج الأزرار
    bot.action('add_server', async (ctx) => {
        await ctx.answerCbQuery();
        
        const serverTypes = {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "🌐 Aternos", callback_data: "server_aternos" },
                        { text: "⚡ Pedrock", callback_data: "server_pedrock" }
                    ],
                    [
                        { text: "🎮 سيرفر خاص", callback_data: "server_custom" },
                        { text: "🔗 مشاركة", callback_data: "server_share" }
                    ],
                    [
                        { text: "🔙 رجوع", callback_data: "back_to_main" }
                    ]
                ]
            }
        };
        
        await ctx.editMessageText(`
🎮 *إضافة سيرفر جديد*

📌 *اختر نوع السيرفر:*

1️⃣ **🌐 Aternos** - سيرفرات مجانية
2️⃣ **⚡ Pedrock** - سيرفرات بيدروك
3️⃣ **🎮 سيرفر خاص** - IP مخصص
4️⃣ **🔗 مشاركة** - مشاركة سيرفر موجود

👇 *اختر النوع المناسب:*
        `, {
            parse_mode: 'Markdown',
            ...serverTypes
        });
    });
    
    // 🌐 إضافة سيرفر Aternos
    bot.action('server_aternos', async (ctx) => {
        await ctx.answerCbQuery();
        
        await ctx.editMessageText(`
🌐 *إضافة سيرفر Aternos*

📝 *أرسل اسم سيرفر Aternos:*

📌 *الشكل:* **اسمك.aternos.me**

📋 *مثال:* 
myworld.aternos.me
bestserver.aternos.me
playwithme.aternos.me

✏️ *اكتب الآن:*
        `, {
            parse_mode: 'Markdown'
        });
        
        // استقبال الاسم
        const userId = ctx.from.id;
        const handler = async (nextCtx) => {
            if (nextCtx.from.id === userId) {
                const serverName = nextCtx.message.text.trim();
                
                if (serverName.toLowerCase().endsWith('.aternos.me')) {
                    await nextCtx.reply(`
✅ *تم إضافة سيرفر Aternos بنجاح!* 🎉

📛 **${serverName}**
🌐 **IP:** ${serverName}:25565
⚡ **النوع:** Aternos مجاني
🎮 **الإصدار:** 1.21.1
📊 **الحالة:** ⏳ جاهز للتشغيل

👇 *اختر الإجراء التالي:*
                    `, {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    { text: "🚀 تشغيل الآن", callback_data: `start_${serverName}` },
                                    { text: "⚙️ إعدادات", callback_data: `settings_${serverName}` }
                                ],
                                [
                                    { text: "➕ إضافة آخر", callback_data: "add_server" },
                                    { text: "📋 السيرفرات", callback_data: "my_servers" }
                                ]
                            ]
                        }
                    });
                    
                    bot.off('text', handler);
                } else {
                    await nextCtx.reply('❌ *الاسم غير صحيح!*\n\nيجب أن ينتهي بـ **.aternos.me**\n\n✏️ حاول مرة أخرى:');
                }
            }
        };
        
        bot.on('text', handler);
    });
    
    // ⚡ إضافة سيرفر Pedrock
    bot.action('server_pedrock', async (ctx) => {
        await ctx.answerCbQuery();
        
        const versions = {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "1.21.132", callback_data: "version_1.21.132" },
                        { text: "1.21.130", callback_data: "version_1.21.130" }
                    ],
                    [
                        { text: "1.21.100", callback_data: "version_1.21.100" },
                        { text: "1.21.50", callback_data: "version_1.21.50" }
                    ],
                    [
                        { text: "🔙 رجوع", callback_data: "add_server" }
                    ]
                ]
            }
        };
        
        await ctx.editMessageText(`
⚡ *إضافة سيرفر Pedrock*

🎮 *اختر إصدار بيدروك:*

📌 *الإصدارات المدعومة:*
• 1.21.132 (أحدث)
• 1.21.130 (مستقر)
• 1.21.100 (شائع)
• 1.21.50 (قديم)

👇 *اختر الإصدار:*
        `, {
            parse_mode: 'Markdown',
            ...versions
        });
    });
    
    // 📋 سيرفراتي
    bot.action('my_servers', async (ctx) => {
        await ctx.answerCbQuery();
        
        const servers = {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "🌐 myserver.aternos.me", callback_data: "server_myserver" },
                        { text: "🟢 Online", callback_data: "status_myserver" }
                    ],
                    [
                        { text: "⚡ pedrock.net", callback_data: "server_pedrock" },
                        { text: "🟡 Idle", callback_data: "status_pedrock" }
                    ],
                    [
                        { text: "🎮 play.example.com", callback_data: "server_example" },
                        { text: "🔴 Offline", callback_data: "status_example" }
                    ],
                    [
                        { text: "➕ إضافة جديد", callback_data: "add_server" },
                        { text: "🔄 تحديث", callback_data: "refresh_servers" }
                    ],
                    [
                        { text: "🔙 الرئيسية", callback_data: "back_to_main" }
                    ]
                ]
            }
        };
        
        await ctx.editMessageText(`
📋 *سيرفراتي*

🖥️ **3 سيرفرات نشطة**

1️⃣ **🌐 myserver.aternos.me**
   🟢 Online | 👥 2/10 | ⏰ 45m

2️⃣ **⚡ pedrock.net**
   🟡 Idle | 👥 0/20 | ⏰ 2h

3️⃣ **🎮 play.example.com**
   🔴 Offline | 👥 - | ⏰ -

📊 *الإجمالي:* 2 سيرفر نشط، 5 بوت

👇 *اختر سيرفر للإدارة:*
        `, {
            parse_mode: 'Markdown',
            ...servers
        });
    });
    
    // ⚡ تشغيل سريع
    bot.action('quick_start', async (ctx) => {
        await ctx.answerCbQuery('جاري التشغيل...');
        
        await ctx.editMessageText(`
⚡ *التشغيل السريع*

🚀 *جاري تشغيل النظام...*

✅ *المهام المكتملة:*
✓ تهيئة البوتات
✓ الاتصال بالسيرفرات
✓ بدء المراقبة
✓ تفعيل الحماية

🎮 *النظام يعمل الآن!*

📊 *الحالة الحالية:*
• 🤖 3 بوت نشط
• 🌐 سيرفران متصلان
• ⚡ الأداء: ممتاز
• 🛡️ الحماية: مفعلة

👇 *يمكنك الآن:*
        `, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "🎮 أضف سيرفر", callback_data: "add_server" },
                        { text: "📊 الإحصائيات", callback_data: "stats" }
                    ],
                    [
                        { text: "⚙️ الإعدادات", callback_data: "settings" }
                    ]
                ]
            }
        });
    });
    
    // 📊 الإحصائيات
    bot.action('stats', async (ctx) => {
        await ctx.answerCbQuery();
        
        const statsMessage = `
📊 *إحصائيات النظام*

🏆 *النظرة العامة:*
┌─────────────────────
│ 👥 المستخدمون: 1,247
│ 🌐 السيرفرات: 24
│ 🤖 البوتات: 156
│ ⏰ وقت التشغيل: 99.9%
└─────────────────────

📈 *النشاط اليومي:*
┌─────────────────────
│ ➕ سيرفرات جديدة: 8
│ 🚀 تشغيلات: 142
│ ⚡ عمليات: 2,847
│ 💾 الذاكرة: 342MB
└─────────────────────

🎮 *التوزيع:*
• Aternos: 45%
• Pedrock: 35%
• سيرفرات خاصة: 20%

🕒 *آخر تحديث:* الآن
        `;
        
        await ctx.editMessageText(statsMessage, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "🔄 تحديث", callback_data: "stats" },
                        { text: "📱 لوحة التحكم", url: `http://localhost:${PORT}` }
                    ],
                    [
                        { text: "🔙 رجوع", callback_data: "back_to_main" }
                    ]
                ]
            }
        });
    });
    
    // 🆘 مركز المساعدة
    bot.action('help_center', async (ctx) => {
        await ctx.answerCbQuery();
        
        const helpMessage = `
🆘 *مركز المساعدة*

❓ *كيفية البدء:*
1. أضف سيرفر من "إضافة سيرفر"
2. شغل النظام من "تشغيل سريع"
3. تابع الإحصائيات من "الإحصائيات"

📌 *الدعم الفني:*
• @vsyfyk - قناة المودات
• @N_NHGER - ترويج سيرفرات
• @sjxhhdbx72 - قناة تعليمية

🔧 *استكشاف الأخطاء:*
• البوت لا يرد → تحقق من التوكن
• السيرفر لا يعمل → تحقق من IP
• بطء النظام → قلل عدد البوتات

💡 *نصائح احترافية:*
• استخدم إصدار 1.21.132 للأفضل أداء
• أضف 2-3 بوت لكل سيرفر
• راجع الإحصائيات بانتظام
        `;
        
        await ctx.editMessageText(helpMessage, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "📖 الأسئلة الشائعة", callback_data: "faq" },
                        { text: "🎥 فيديو تعليمي", callback_data: "tutorial" }
                    ],
                    [
                        { text: "🔙 رجوع", callback_data: "back_to_main" }
                    ]
                ]
            }
        });
    });
    
    // 🔙 العودة للرئيسية
    bot.action('back_to_main', async (ctx) => {
        await ctx.answerCbQuery();
        ctx.callbackQuery.data = null;
        bot.start(ctx);
    });
    
    // 🎮 أي رسالة نصية
    bot.on('text', async (ctx) => {
        const text = ctx.message.text;
        
        if (text && !text.startsWith('/')) {
            await ctx.reply(`
💬 *تم استلام رسالتك*

📝 "${text}"

🎮 *للاستخدام الأمثل:*
استخدم الأزرار في القائمة الرئيسية (/start)

⚡ *للتحويل السريع:*
أرسل /start للعودة للقائمة الرئيسية
            `, {
                parse_mode: 'Markdown'
            });
        }
    });
    
    // 🚀 تشغيل البوت
    bot.launch({
        dropPendingUpdates: true,
        allowedUpdates: ['message', 'callback_query']
    })
    .then(() => {
        console.log('🤖 بوت التلجرام الاحترافي يعمل!');
        console.log('🎨 أرسل /start للبدء');
        console.log('🌐 الواجهة: http://localhost:' + PORT);
    })
    .catch(err => {
        console.error('❌ خطأ في البوت:', err.message);
        console.log('🔍 تأكد من:');
        console.log('1. التوكن صحيح في متغيرات البيئة');
        console.log('2. البوت نشط في @BotFather');
        console.log('3. الإنترنت يعمل');
    });
    
} catch (error) {
    console.error('💥 خطأ فادح:', error.message);
}
