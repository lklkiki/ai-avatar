document.addEventListener('DOMContentLoaded', () => {
    // 检查登录状态
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (!userData.username) {
        window.location.href = 'index.html';
        return;
    }

    // 更新用户信息
    document.querySelector('.user-name').textContent = userData.username;

    // 分身切换功能
    const avatarList = document.querySelector('.avatar-list');
    avatarList.addEventListener('click', (e) => {
        const avatarItem = e.target.closest('.avatar-item');
        if (avatarItem) {
            if (avatarItem.classList.contains('add-avatar')) {
                openCreateAvatarModal();
            } else {
                document.querySelectorAll('.avatar-item').forEach(item => {
                    item.classList.remove('active');
                });
                avatarItem.classList.add('active');
            }
        }
    });

    // 创建分身弹窗功能
    const modal = document.getElementById('createAvatarModal');
    const closeButtons = document.querySelectorAll('.close-modal');

    function openCreateAvatarModal() {
        modal.classList.add('active');
    }

    function closeCreateAvatarModal() {
        modal.classList.remove('active');
        document.querySelector('.create-avatar-form').reset();
        document.getElementById('photoPreview').innerHTML = '';
        document.getElementById('audioPreview').innerHTML = '';
    }

    closeButtons.forEach(button => {
        button.addEventListener('click', closeCreateAvatarModal);
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeCreateAvatarModal();
        }
    });

    // 上传区域的处理
    const uploadAreas = {
        visual: document.getElementById('visualUpload'),
        audio: document.getElementById('audioUpload'),
        data: document.getElementById('dataUpload')
    };

    const previewAreas = {
        visual: document.getElementById('visualPreview'),
        audio: document.getElementById('audioPreview'),
        data: document.getElementById('dataPreview')
    };

    const progressBars = {
        visual: document.querySelector('.progress-item:nth-child(1) .progress-fill'),
        audio: document.querySelector('.progress-item:nth-child(2) .progress-fill'),
        data: document.querySelector('.progress-item:nth-child(3) .progress-fill')
    };

    const progressStatus = {
        visual: document.querySelector('.progress-item:nth-child(1) .progress-status'),
        audio: document.querySelector('.progress-item:nth-child(2) .progress-status'),
        data: document.querySelector('.progress-item:nth-child(3) .progress-status')
    };

    // 文件上传处理
    function handleFileUpload(files, type) {
        const previewArea = previewAreas[type];
        const progressBar = progressBars[type];
        const status = progressStatus[type];
        
        // 清空预览区域
        previewArea.innerHTML = '';
        
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';

            reader.onload = function(e) {
                let preview;
                if (type === 'visual') {
                    if (file.type.startsWith('image/')) {
                        preview = `<img src="${e.target.result}" alt="预览">`;
                    } else if (file.type.startsWith('video/')) {
                        preview = `<video src="${e.target.result}" controls></video>`;
                    }
                } else if (type === 'audio') {
                    preview = `<audio src="${e.target.result}" controls></audio>`;
                } else {
                    preview = `
                        <div style="padding: 1rem; text-align: center;">
                            <div style="font-size: 2rem;">📄</div>
                            <div style="font-size: 0.8rem; word-break: break-all;">${file.name}</div>
                        </div>
                    `;
                }

                previewItem.innerHTML = `
                    ${preview}
                    <button class="remove-preview" title="删除">&times;</button>
                `;
            };

            reader.readAsDataURL(file);
            previewArea.appendChild(previewItem);
        });

        // 更新进度条和状态
        const progress = Math.min(files.length * 20, 100);
        progressBar.style.width = `${progress}%`;
        status.textContent = files.length > 0 ? '已上传' : '待上传';

        // 检查是否可以开始创建
        checkCreationStatus();
    }

    // 为每个上传区域添加事件监听
    Object.entries(uploadAreas).forEach(([type, area]) => {
        const input = area.querySelector('input[type="file"]');
        
        area.addEventListener('click', () => input.click());
        
        input.addEventListener('change', (e) => {
            handleFileUpload(e.target.files, type);
        });

        // 拖拽上传
        area.addEventListener('dragover', (e) => {
            e.preventDefault();
            area.classList.add('dragover');
        });

        area.addEventListener('dragleave', () => {
            area.classList.remove('dragover');
        });

        area.addEventListener('drop', (e) => {
            e.preventDefault();
            area.classList.remove('dragover');
            handleFileUpload(e.dataTransfer.files, type);
        });
    });

    // 删除预览项
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-preview')) {
            const previewItem = e.target.closest('.preview-item');
            const previewArea = previewItem.parentElement;
            const type = Object.entries(previewAreas).find(([, area]) => area === previewArea)[0];
            
            previewItem.remove();
            
            // 更新进度
            const remainingItems = previewArea.children.length;
            const progress = Math.min(remainingItems * 20, 100);
            progressBars[type].style.width = `${progress}%`;
            progressStatus[type].textContent = remainingItems > 0 ? '已上传' : '待上传';
            
            checkCreationStatus();
        }
    });

    // 检查是否可以开始创建
    function checkCreationStatus() {
        const startButton = document.querySelector('.start-creation-btn');
        const hasFiles = Object.values(previewAreas).every(area => area.children.length > 0);
        
        startButton.disabled = !hasFiles;
        if (hasFiles) {
            startButton.textContent = '开始创建';
        } else {
            startButton.textContent = '请上传所有必需文件';
        }
    }

    // 添加API配置
    const API_CONFIG = {
        volcEngine: {
            appId: 'YOUR_VOLC_APP_ID',
            apiKey: 'YOUR_VOLC_API_KEY',
            apiEndpoint: 'https://api.volcengine.com/tts/v1/clone'
        },
        siliconAI: {
            sdkKey: 'YOUR_SILICON_SDK_KEY',
            apiEndpoint: 'https://api.silicon.ai/train'
        }
    };

    // 音色克隆处理函数
    async function processVoiceClone(audioFiles) {
        try {
            const formData = new FormData();
            audioFiles.forEach(file => {
                formData.append('audio_files[]', file);
            });

            const response = await fetch(API_CONFIG.volcEngine.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_CONFIG.volcEngine.apiKey}`,
                    'X-App-Id': API_CONFIG.volcEngine.appId
                },
                body: formData
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || '音色克隆处理失败');
            }

            return {
                voiceId: data.voice_id,
                status: 'success'
            };
        } catch (error) {
            console.error('音色克隆错误:', error);
            throw error;
        }
    }

    // 硅基智能模型训练函数
    async function trainSiliconModel(visualFiles, textFiles) {
        try {
            const formData = new FormData();
            
            // 添加视觉数据
            visualFiles.forEach(file => {
                formData.append('visual_data[]', file);
            });

            // 添加文本数据
            textFiles.forEach(file => {
                formData.append('text_data[]', file);
            });

            const response = await fetch(API_CONFIG.siliconAI.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_CONFIG.siliconAI.sdkKey}`,
                    'Content-Type': 'multipart/form-data'
                },
                body: formData
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || '模型训练初始化失败');
            }

            return {
                modelId: data.model_id,
                status: 'training'
            };
        } catch (error) {
            console.error('模型训练错误:', error);
            throw error;
        }
    }

    // 修改开始创建按钮的处理逻辑
    document.querySelector('.start-creation-btn').addEventListener('click', async () => {
        if (confirm('确认开始创建AI形象吗？上传的所有资料将用于训练模型。')) {
            const button = document.querySelector('.start-creation-btn');
            button.disabled = true;
            button.textContent = '创建中...';
            
            // 创建加载遮罩
            const loadingOverlay = document.createElement('div');
            loadingOverlay.className = 'loading-overlay';
            loadingOverlay.innerHTML = `
                <div class="loading-spinner"></div>
                <div class="loading-text">正在处理数据...</div>
                <div class="loading-progress">0%</div>
            `;
            document.body.appendChild(loadingOverlay);
            
            try {
                // 收集所有上传的文件
                const visualFiles = Array.from(document.querySelectorAll('#visualPreview .preview-item'))
                    .map(item => item.querySelector('img, video'))
                    .filter(el => el)
                    .map(el => {
                        const url = el.src;
                        return fetch(url).then(res => res.blob());
                    });

                const audioFiles = Array.from(document.querySelectorAll('#audioPreview .preview-item audio'))
                    .map(audio => {
                        const url = audio.src;
                        return fetch(url).then(res => res.blob());
                    });

                const textFiles = Array.from(document.querySelectorAll('#dataPreview .preview-item'))
                    .map(item => {
                        const fileName = item.querySelector('div').textContent;
                        return fetch(item.dataset.fileUrl).then(res => res.blob());
                    });

                // 等待所有文件加载完成
                const [visualBlobs, audioBlobs, textBlobs] = await Promise.all([
                    Promise.all(visualFiles),
                    Promise.all(audioFiles),
                    Promise.all(textFiles)
                ]);

                loadingOverlay.querySelector('.loading-text').textContent = '正在处理音色克隆...';
                loadingOverlay.querySelector('.loading-progress').textContent = '30%';
                
                // 处理音色克隆
                const voiceResult = await processVoiceClone(audioBlobs);

                loadingOverlay.querySelector('.loading-text').textContent = '正在训练个性化模型...';
                loadingOverlay.querySelector('.loading-progress').textContent = '60%';
                
                // 训练硅基模型
                const modelResult = await trainSiliconModel(visualBlobs, textBlobs);

                // 保存训练信息到本地存储
                const trainingInfo = {
                    voiceId: voiceResult.voiceId,
                    modelId: modelResult.modelId,
                    startTime: new Date().toISOString(),
                    status: 'training'
                };
                localStorage.setItem('trainingInfo', JSON.stringify(trainingInfo));

                loadingOverlay.querySelector('.loading-text').textContent = '创建成功！';
                loadingOverlay.querySelector('.loading-progress').textContent = '100%';

                // 显示成功消息
                setTimeout(() => {
                    alert(`创建任务已提交！
训练ID：${modelResult.modelId}
音色ID：${voiceResult.voiceId}
我们会通过邮件通知您训练进度。`);
                    
                    // 重置所有上传区域
                    Object.values(previewAreas).forEach(area => area.innerHTML = '');
                    Object.values(progressBars).forEach(bar => bar.style.width = '0%');
                    Object.values(progressStatus).forEach(status => status.textContent = '待上传');
                    button.textContent = '请上传所有必需文件';
                    loadingOverlay.remove();
                }, 1000);

            } catch (error) {
                console.error('创建过程出错:', error);
                alert(`创建失败：${error.message}`);
                button.disabled = false;
                button.textContent = '开始创建';
                loadingOverlay.remove();
            }
        }
    });

    // 添加训练进度轮询
    function pollTrainingStatus() {
        const trainingInfo = JSON.parse(localStorage.getItem('trainingInfo'));
        if (trainingInfo && trainingInfo.status === 'training') {
            // 查询音色克隆状态
            fetch(`${API_CONFIG.volcEngine.apiEndpoint}/status/${trainingInfo.voiceId}`, {
                headers: {
                    'Authorization': `Bearer ${API_CONFIG.volcEngine.apiKey}`,
                    'X-App-Id': API_CONFIG.volcEngine.appId
                }
            })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'completed') {
                    // 更新音色克隆状态
                    trainingInfo.voiceStatus = 'completed';
                    localStorage.setItem('trainingInfo', JSON.stringify(trainingInfo));
                }
            });

            // 查询模型训练状态
            fetch(`${API_CONFIG.siliconAI.apiEndpoint}/status/${trainingInfo.modelId}`, {
                headers: {
                    'Authorization': `Bearer ${API_CONFIG.siliconAI.sdkKey}`
                }
            })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'completed') {
                    // 更新模型训练状态
                    trainingInfo.modelStatus = 'completed';
                    localStorage.setItem('trainingInfo', JSON.stringify(trainingInfo));

                    // 如果两个训练都完成，发送通知
                    if (trainingInfo.voiceStatus === 'completed') {
                        alert('您的AI形象训练已完成！');
                        localStorage.removeItem('trainingInfo');
                    }
                }
            });
        }
    }

    // 每5分钟检查一次训练状态
    setInterval(pollTrainingStatus, 5 * 60 * 1000);

    // 删除功能处理
    function handleDelete(element, type) {
        const confirmMessages = {
            avatar: '确定要删除这个分身吗？',
            trait: '确定要删除这个性格特征吗？',
            diary: '确定要删除这条日记吗？'
        };

        if (confirm(confirmMessages[type])) {
            // 这里应该调用后端 API 进行删除
            // 模拟删除过程
            element.style.opacity = '0';
            element.style.transform = 'scale(0.8)';
            setTimeout(() => {
                element.remove();
            }, 300);
        }
    }

    // 分身删除功能
    document.querySelectorAll('.avatar-item:not(.add-avatar) .delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // 防止触发分身切换
            const avatarItem = e.target.closest('.avatar-item');
            handleDelete(avatarItem, 'avatar');
        });
    });

    // 性格特征删除功能
    document.querySelectorAll('.tag:not(.add-tag) .delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const tag = e.target.closest('.tag');
            handleDelete(tag, 'trait');
        });
    });

    // 日记删除功能
    document.querySelectorAll('.diary-item .delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const diaryItem = e.target.closest('.diary-item');
            handleDelete(diaryItem, 'diary');
        });
    });

    // 为新创建的元素添加删除功能
    function addDeleteButton(element, type) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '&times;';
        deleteBtn.title = `删除${type === 'avatar' ? '分身' : type === 'trait' ? '特征' : '日记'}`;
        
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            handleDelete(element, type);
        });
        
        element.insertBefore(deleteBtn, element.firstChild);
    }

    // 分步表单处理
    let currentStep = 1;
    const totalSteps = 3;
    const form = document.querySelector('.create-avatar-form');
    const nextBtn = document.getElementById('nextStep');
    const prevBtn = document.getElementById('prevStep');
    const submitBtn = document.getElementById('submitForm');

    function updateStepIndicator() {
        document.querySelectorAll('.step').forEach(step => {
            const stepNum = parseInt(step.dataset.step);
            step.classList.remove('active', 'completed');
            if (stepNum === currentStep) {
                step.classList.add('active');
            } else if (stepNum < currentStep) {
                step.classList.add('completed');
            }
        });
    }

    function showStep(step) {
        document.querySelectorAll('.form-step').forEach(formStep => {
            formStep.classList.remove('active');
        });
        document.getElementById(`step${step}`).classList.add('active');

        // 更新按钮显示状态
        prevBtn.style.display = step === 1 ? 'none' : 'block';
        nextBtn.style.display = step === totalSteps ? 'none' : 'block';
        submitBtn.style.display = step === totalSteps ? 'block' : 'none';

        updateStepIndicator();
    }

    function validateStep(step) {
        const currentFormStep = document.getElementById(`step${step}`);
        const requiredFields = currentFormStep.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                isValid = false;
                field.classList.add('error');
                
                // 添加错误提示
                let errorMsg = field.nextElementSibling;
                if (!errorMsg || !errorMsg.classList.contains('error-message')) {
                    errorMsg = document.createElement('div');
                    errorMsg.className = 'error-message';
                    errorMsg.textContent = '此项不能为空';
                    field.parentNode.insertBefore(errorMsg, field.nextSibling);
                }
            } else {
                field.classList.remove('error');
                const errorMsg = field.nextElementSibling;
                if (errorMsg && errorMsg.classList.contains('error-message')) {
                    errorMsg.remove();
                }
            }
        });

        return isValid;
    }

    nextBtn.addEventListener('click', () => {
        if (validateStep(currentStep)) {
            currentStep++;
            showStep(currentStep);
        }
    });

    prevBtn.addEventListener('click', () => {
        currentStep--;
        showStep(currentStep);
    });

    // 表单提交处理
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validateStep(currentStep)) {
            return;
        }

        const formData = new FormData(form);
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">正在创建新生命...</div>
        `;
        document.body.appendChild(loadingOverlay);
        
        try {
            // 这里应该调用后端 API 上传数据
            // 模拟上传过程
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // 添加新分身到列表
            const newAvatar = document.createElement('div');
            newAvatar.className = 'avatar-item';
            newAvatar.innerHTML = `
                <button class="delete-btn" title="删除分身">&times;</button>
                <div class="avatar-preview">
                    ${formData.get('avatar') ? '<img src="' + URL.createObjectURL(formData.get('avatar')) + '" alt="头像">' : '😊'}
                </div>
                <span>${formData.get('nickname') || '新的分身'}</span>
            `;
            
            const addAvatarButton = document.querySelector('.add-avatar');
            const avatarList = document.querySelector('.avatar-list');
            avatarList.insertBefore(newAvatar, addAvatarButton);
            
            // 添加删除功能
            addDeleteButton(newAvatar, 'avatar');
            
            closeCreateAvatarModal();
            alert('创建成功！');
        } catch (error) {
            alert('创建失败，请重试！');
        } finally {
            loadingOverlay.remove();
        }
    });

    // 添加加载动画样式
    const style = document.createElement('style');
    style.textContent = `
        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 2000;
        }

        .loading-spinner {
            width: 50px;
            height: 50px;
            border: 3px solid #fff;
            border-radius: 50%;
            border-top-color: var(--primary-color);
            animation: spin 1s linear infinite;
        }

        .loading-text {
            color: #fff;
            margin-top: 1rem;
            font-size: 1.1rem;
        }

        @keyframes spin {
            to {
                transform: rotate(360deg);
            }
        }

        .error {
            border-color: #ff3b30 !important;
        }

        .error-message {
            color: #ff3b30;
            font-size: 0.8rem;
            margin-top: 0.25rem;
        }
    `;
    document.head.appendChild(style);

    // 修改添加性格特征的代码，添加删除按钮
    const addTagBtn = document.querySelector('.add-tag');
    addTagBtn.addEventListener('click', () => {
        const trait = prompt('请输入新的性格特征：');
        if (trait) {
            const traitTags = document.querySelector('.trait-tags');
            const newTag = document.createElement('span');
            newTag.className = 'tag';
            newTag.textContent = trait;
            
            addDeleteButton(newTag, 'trait');
            
            traitTags.insertBefore(newTag, addTagBtn);
        }
    });

    // 修改写新日记的代码，添加删除按钮
    const writeDiaryBtn = document.querySelector('.write-diary-btn');
    writeDiaryBtn.addEventListener('click', () => {
        const diaryList = document.querySelector('.diary-list');
        const today = new Date().toISOString().split('T')[0];
        
        const newDiary = document.createElement('div');
        newDiary.className = 'diary-item';
        newDiary.innerHTML = `
            <div class="diary-date">${today}</div>
            <div class="diary-preview">
                <textarea placeholder="写下今天的社交记录..." style="width: 100%; min-height: 80px; border: none; background: transparent; resize: none;"></textarea>
            </div>
        `;
        
        addDeleteButton(newDiary, 'diary');
        
        diaryList.insertBefore(newDiary, writeDiaryBtn);
    });

    // 语言风格切换
    const styleSelect = document.querySelector('.style-select');
    styleSelect.addEventListener('change', (e) => {
        console.log('切换语言风格为：', e.target.value);
    });

    // 数据中心动画效果
    const stats = document.querySelectorAll('.stat-value');
    stats.forEach(stat => {
        const value = parseInt(stat.textContent);
        stat.textContent = '0';
        let current = 0;
        const increment = value / 30;
        const timer = setInterval(() => {
            current += increment;
            if (current >= value) {
                stat.textContent = value;
                clearInterval(timer);
            } else {
                stat.textContent = Math.round(current);
            }
        }, 30);
    });

    // 查看详细报告
    const viewDetailsBtn = document.querySelector('.view-details-btn');
    viewDetailsBtn.addEventListener('click', () => {
        alert('详细数据报告功能即将上线！');
    });
}); 