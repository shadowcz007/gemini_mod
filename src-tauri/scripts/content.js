// 等待 DOM 加载完成
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMixlab);
} else {
    initMixlab();
}

async function initMixlab() {
    try {
        console.log('开始初始化 MIXLAB...');
        
        // 检查 Tauri 对象是否存在
        if (!window.__TAURI__) {
            console.error('Tauri 对象不存在！');
            return;
        }
        
        // 等待 Tauri 准备就绪
        console.log('等待 Tauri 准备...');
        await window.__TAURI__.ready;
        console.log('Tauri 已就绪');
        
        // 添加脚本加载标记
        window.__MIXLAB_SCRIPT_LOADED = true;
        console.log('MIXLAB 脚本开始执行');
        
        // 创建悬浮按钮
        console.log('开始创建悬浮按钮...');
        
        // 添加点击事件
        const button = document.createElement('button');
        button.className = 'mixlab-button';
        button.textContent = '收集整理';

        button.addEventListener('click', async () => {
            try {
                // 获取主要内容区域的文本
                const mainContent = document.querySelector('main');
                const content = mainContent ? mainContent.innerText : document.body.innerText;
                await window.__TAURI__.invoke('save_content', { content });
                
                // 使用原生对话框替代 alert
                const dialog = document.createElement('dialog');
                dialog.style.cssText = `
                    padding: 20px;
                    border-radius: 8px;
                    border: 1px solid #ccc;
                    background: white;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                `;
                dialog.textContent = '内容已保存！';
                document.body.appendChild(dialog);
                dialog.show();
                setTimeout(() => {
                    dialog.remove();
                }, 2000);
            } catch (error) {
                console.error('保存失败：', error);
                const errorDialog = document.createElement('dialog');
                errorDialog.style.cssText = `
                    padding: 20px;
                    border-radius: 8px;
                    border: 1px solid #f44336;
                    background: white;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    color: #f44336;
                `;
                errorDialog.textContent = '保存失败：' + error;
                document.body.appendChild(errorDialog);
                errorDialog.show();
                setTimeout(() => {
                    errorDialog.remove();
                }, 3000);
            }
        });

        // 使用 requestAnimationFrame 确保在 DOM 完全准备好后添加按钮
        requestAnimationFrame(() => {
            document.body.appendChild(button);
        });
        
        console.log('MIXLAB 脚本执行完成');
    } catch (error) {
        console.error('MIXLAB 初始化失败：', error);
    }
}
