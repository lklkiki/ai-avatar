document.addEventListener('DOMContentLoaded', () => {
    // 平滑滚动
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // 切换注册/登录表单
    const authTabs = document.querySelectorAll('.auth-tab');
    const authForms = document.querySelectorAll('.auth-form');

    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetForm = tab.dataset.tab;
            
            // 切换标签激活状态
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // 切换表单显示
            authForms.forEach(form => {
                form.classList.remove('active');
                if (form.id === `${targetForm}Form`) {
                    form.classList.add('active');
                }
            });
        });
    });

    // 注册表单处理
    const registerForm = document.getElementById('registerForm');
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(registerForm);
        const userData = {
            email: formData.get('email'),
            username: formData.get('username'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword')
        };

        if (userData.password !== userData.confirmPassword) {
            alert('两次输入的密码不一致！');
            return;
        }

        try {
            // 这里应该调用后端 API 进行注册
            // 模拟 API 调用
            localStorage.setItem('userData', JSON.stringify({
                username: userData.username,
                email: userData.email
            }));
            
            alert('注册成功！');
            window.location.href = 'dashboard.html';
        } catch (error) {
            alert('注册失败，请重试！');
        }
    });

    // 登录表单处理
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(loginForm);
        const loginData = {
            username: formData.get('username'),
            password: formData.get('password')
        };

        try {
            // 这里应该调用后端 API 进行登录验证
            // 模拟 API 调用
            const storedUserData = localStorage.getItem('userData');
            if (storedUserData) {
                const userData = JSON.parse(storedUserData);
                if (loginData.username === userData.username) {
                    window.location.href = 'dashboard.html';
                    return;
                }
            }
            alert('用户名或密码错误！');
        } catch (error) {
            alert('登录失败，请重试！');
        }
    });

    // 添加滚动动画
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.feature-card, .scenario-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        observer.observe(card);
    });
});

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    .fade-in {
        animation: fadeIn 0.6s ease forwards;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style); 