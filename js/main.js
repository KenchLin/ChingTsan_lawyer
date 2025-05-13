document.addEventListener('DOMContentLoaded', function () {
    // ===== Scroll 進入時淡入動畫 =====
    const faders = document.querySelectorAll('.fade-in');

    const appearOnScroll = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            entry.target.classList.toggle('show', entry.isIntersecting);
        });
    }, {
        threshold: 0.3,
        rootMargin: "0px 0px -50px 0px"
    });

    faders.forEach(fader => appearOnScroll.observe(fader));

    // ===== 勝訴案例 tab 切換邏輯 =====
    const tabs = document.querySelectorAll('.case-tab');
    const panels = document.querySelectorAll('.case-panel');
    const casesSection = document.getElementById('cases'); // 精選勝訴案例區塊

    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('show'));

            const targetId = 'panel-' + this.dataset.target;
            this.classList.add('active');
            const targetPanel = document.getElementById(targetId);
            targetPanel?.classList.add('show');

            // 動態調整背景圖片與區塊高度
            const newHeight = targetPanel ? targetPanel.offsetHeight : 600; // 根據顯示區域調整
            casesSection.style.minHeight = `${newHeight + 100}px`; // 留下足夠的空間以容納動畫

            // 進行背景圖片縮放
            if (targetPanel) {
                casesSection.style.backgroundSize = '110%'; // 放大背景圖片
            } else {
                casesSection.style.backgroundSize = 'cover'; // 回到原來大小
            }
        });
    });

    // 預設點擊第一個 tab
    if (tabs.length > 0) {
        tabs[0].click();
    }

    // ===== 案例滑軌與燈箱互動邏輯 =====
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxTitle = document.querySelector('.lightbox-title');
    const lightboxDescription = document.querySelector('.lightbox-description');
    const lightboxClose = document.querySelector('.lightbox-close');
    const lightboxImageContainer = document.querySelector('.lightbox-image-container');

    // 圖片操作相關變數
    let scale = 1;
    let startDistance = 0;
    let currentDistance = 0;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let translateX = 0;
    let translateY = 0;
    let isMobile = window.innerWidth <= 768;
    let isMouseDown = false;
    let lastX = 0;
    let lastY = 0;
    let isAnimating = false;

    // 重置圖片狀態
    function resetImageState() {
        scale = 1;
        translateX = 0;
        translateY = 0;
        isDragging = false;
        isMouseDown = false;
        lastX = 0;
        lastY = 0;
        lightboxImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    }

    // 處理縮放
    function handleZoom(newScale) {
        const oldScale = scale;
        scale = Math.max(1, Math.min(3, newScale));
        
        if (scale !== oldScale) {
            // 如果縮放到最小，自動置中
            if (scale === 1) {
                translateX = 0;
                translateY = 0;
            } else {
                // 計算新的位移以保持圖片在中心
                const imgRect = lightboxImg.getBoundingClientRect();
                const containerRect = lightboxImageContainer.getBoundingClientRect();
                
                const maxX = (imgRect.width * scale - containerRect.width) / 2;
                const maxY = (imgRect.height * scale - containerRect.height) / 2;
                
                translateX = Math.max(-maxX, Math.min(maxX, translateX));
                translateY = Math.max(-maxY, Math.min(maxY, translateY));
            }
            
            lightboxImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        }
    }

    // 處理雙指縮放
    function handlePinch(e) {
        if (e.touches.length === 2) {
            e.preventDefault();
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            
            if (!startDistance) {
                startDistance = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY
                );
            }
            
            currentDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
            
            const newScale = scale * (currentDistance / startDistance);
            const centerX = (touch1.clientX + touch2.clientX) / 2;
            const centerY = (touch1.clientY + touch2.clientY) / 2;
            
            handleZoom(newScale);
        }
    }

    // 處理滑鼠滾輪縮放
    function handleWheel(e) {
        e.preventDefault();
        const delta = e.deltaY;
        const zoomFactor = delta > 0 ? 0.9 : 1.1;
        handleZoom(scale * zoomFactor);
    }

    // 處理拖曳
    function handleDrag(e) {
        if (!isMouseDown) return;
        
        e.preventDefault();
        const touch = e.touches ? e.touches[0] : e;
        
        if (!isDragging) {
            isDragging = true;
            lastX = touch.clientX;
            lastY = touch.clientY;
            return;
        }
        
        const deltaX = touch.clientX - lastX;
        const deltaY = touch.clientY - lastY;
        
        translateX += deltaX;
        translateY += deltaY;
        
        // 限制拖曳範圍
        const imgRect = lightboxImg.getBoundingClientRect();
        const containerRect = lightboxImageContainer.getBoundingClientRect();
        
        const maxX = (imgRect.width * scale - containerRect.width) / 2;
        const maxY = (imgRect.height * scale - containerRect.height) / 2;
        
        translateX = Math.max(-maxX, Math.min(maxX, translateX));
        translateY = Math.max(-maxY, Math.min(maxY, translateY));
        
        lightboxImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        
        lastX = touch.clientX;
        lastY = touch.clientY;
    }

    // 重置觸控狀態
    function resetTouchState() {
        if (scale === 1) {
            // 在最小畫面時，使用動畫回到中心
            isAnimating = true;
            lightboxImg.style.transition = 'transform 0.3s ease-out';
            translateX = 0;
            translateY = 0;
            lightboxImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
            
            // 動畫結束後移除過渡效果
            setTimeout(() => {
                lightboxImg.style.transition = '';
                isAnimating = false;
            }, 300);
        }
        
        startDistance = 0;
        currentDistance = 0;
        isDragging = false;
        isMouseDown = false;
        lastX = 0;
        lastY = 0;
    }

    // 開啟燈箱
    function openLightbox(imgSrc) {
        console.log('openLightbox called with:', imgSrc); // 調試日誌
        
        // 從完整路徑中提取文件名並解碼
        const imgName = decodeURIComponent(imgSrc.split('/').pop());
        console.log('Decoded image name:', imgName); // 調試日誌
        
        // 使用解碼後的文件名來查找圖片元素
        const img = document.querySelector(`img[src*="${imgName}"]`);
        console.log('Found image element:', img); // 調試日誌
        
        if (!img) {
            console.log('Image not found, trying alternative method...'); // 調試日誌
            // 嘗試使用更寬鬆的匹配方式
            const allImages = document.querySelectorAll('.carousel-item img');
            const clickedImg = Array.from(allImages).find(img => 
                decodeURIComponent(img.src).includes(imgName)
            );
            console.log('Found image using alternative method:', clickedImg); // 調試日誌
            if (!clickedImg) return;
            
            const title = clickedImg.dataset.caseTitle || '案例詳情';
            const description = clickedImg.dataset.caseDescription || '<p>這是一個示範案例的詳細說明。</p>';

            lightboxImg.src = clickedImg.src;
            lightboxTitle.textContent = title;
            lightboxDescription.innerHTML = description;
        } else {
            const title = img.dataset.caseTitle || '案例詳情';
            const description = img.dataset.caseDescription || '<p>這是一個示範案例的詳細說明。</p>';

            lightboxImg.src = img.src;
            lightboxTitle.textContent = title;
            lightboxDescription.innerHTML = description;
        }
        
        lightbox.classList.remove('hidden');
        requestAnimationFrame(() => {
            lightbox.classList.add('show');
            resetImageState();
        });
    }

    // 關閉燈箱
    function closeLightbox() {
        lightbox.classList.remove('show');
        setTimeout(() => {
            lightbox.classList.add('hidden');
            resetImageState();
        }, 300);
    }

    // 點擊圖片開啟燈箱
    document.querySelectorAll('.carousel-item img').forEach(img => {
        img.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const carouselItem = this.closest('.carousel-item');
            const isActive = carouselItem.classList.contains('active');
            
            if (isActive) {
                // 如果是 active 案例，開啟燈箱
                openLightbox(this.src);
            } else {
                // 如果不是 active 案例，切換到該案例
                const index = parseInt(carouselItem.dataset.index);
                currentIndex = index;
                updateCarousel();
            }
        });
    });

    // 點擊關閉按鈕
    lightboxClose.addEventListener('click', closeLightbox);

    // 點擊燈箱背景關閉
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    // 防止燈箱內容區域的點擊事件冒泡
    document.querySelector('.lightbox-content').addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // 更新滑軌位置與 active 樣式
    function updateCarousel(container, currentIndex) {
        const track = container.querySelector('.carousel-track');
        const items = container.querySelectorAll('.carousel-item');
        const itemWidth = items[0].offsetWidth;
        const gap = parseInt(getComputedStyle(track).gap) || 0;
        const fullItemWidth = itemWidth + gap;
    
        const containerWidth = container.offsetWidth;
        
        let offset;
        if (window.innerWidth <= 768) {
            offset = fullItemWidth * currentIndex;
        } else {
            offset = (fullItemWidth * currentIndex) - (containerWidth / 2) + (itemWidth / 2);
        }
    
        track.style.transform = `translateX(${-offset}px)`;
    
        items.forEach((item, index) => {
            item.classList.toggle('active', index === currentIndex);
        });
    }

    document.querySelectorAll('.carousel-container').forEach(container => {
        const track = container.querySelector('.carousel-track');
        const items = container.querySelectorAll('.carousel-item');
        const leftBtn = container.querySelector('.carousel-btn.left');
        const rightBtn = container.querySelector('.carousel-btn.right');

        let currentIndex = 0;
        let startX = 0;
        let currentX = 0;
        let startY = 0;
        let currentY = 0;
        let isDragging = false;
        let touchStartTime = 0;
        let touchEndTime = 0;
        let hasMoved = false;

        // 點擊圖片開啟燈箱
        items.forEach(item => {
            const img = item.querySelector('img');
            img.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const isActive = item.classList.contains('active');
                
                if (isActive) {
                    // 如果是 active 案例，開啟燈箱
                    openLightbox(this.src);
                } else {
                    // 如果不是 active 案例，切換到該案例
                    currentIndex = parseInt(item.dataset.index);
                    updateCarousel(container, currentIndex);
                }
            });
        });

        // 保留原有的點擊事件處理
        leftBtn?.addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + items.length) % items.length;
            updateCarousel(container, currentIndex);
        });

        rightBtn?.addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % items.length;
            updateCarousel(container, currentIndex);
        });

        // 修改觸控事件處理（手機版）
        function handleTouchStart(e) {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            currentX = startX;
            currentY = startY;
            touchStartTime = Date.now();
            isDragging = false;
            hasMoved = false;
            track.style.transition = 'none';
        }

        function handleTouchMove(e) {
            if (!startX) return;
            
            currentX = e.touches[0].clientX;
            currentY = e.touches[0].clientY;
            
            const diffX = currentX - startX;
            const diffY = currentY - startY;
            
            // 計算移動距離
            const distance = Math.sqrt(diffX * diffX + diffY * diffY);
            
            // 如果移動距離超過閾值，則視為滑動
            if (distance > 10) {
                hasMoved = true;
                isDragging = true;
            }
            
            if (isDragging) {
                const itemWidth = items[0].offsetWidth;
                const gap = parseInt(getComputedStyle(track).gap) || 0;
                const fullItemWidth = itemWidth + gap;
                
                let currentOffset;
                if (window.innerWidth <= 768) {
                    currentOffset = currentIndex * fullItemWidth;
                } else {
                    currentOffset = (fullItemWidth * currentIndex) - (containerWidth / 2) + (itemWidth / 2);
                }
                
                const newOffset = currentOffset - diffX;
                track.style.transform = `translateX(${-newOffset}px)`;
            }
        }

        function handleTouchEnd(e) {
            if (!startX) return;
            
            touchEndTime = Date.now();
            const touchDuration = touchEndTime - touchStartTime;
            const diffX = currentX - startX;
            
            // 重置起始位置
            startX = 0;
            currentX = 0;
            startY = 0;
            currentY = 0;
            
            if (isDragging) {
                // 處理滑動結束
                track.style.transition = 'transform 0.3s ease-out';
                
                const itemWidth = items[0].offsetWidth;
                const gap = parseInt(getComputedStyle(track).gap) || 0;
                const fullItemWidth = itemWidth + gap;
                
                if (Math.abs(diffX) > itemWidth * 0.3) {
                    if (diffX > 0 && currentIndex > 0) {
                        currentIndex--;
                    } else if (diffX < 0 && currentIndex < items.length - 1) {
                        currentIndex++;
                    }
                }
                
                updateCarousel(container, currentIndex);
            } else if (!hasMoved && touchDuration < 300) {
                // 短時間觸摸且沒有明顯移動時，顯示燈箱
                const activeItem = items[currentIndex];
                const activeImg = activeItem.querySelector('img');
                if (activeImg) {
                    e.preventDefault();
                    e.stopPropagation();
                    openLightbox(activeImg.src);
                }
            }
            
            isDragging = false;
            hasMoved = false;
        }

        // 加入觸控事件監聽（僅在手機版）
        if (window.innerWidth <= 768) {
            track.addEventListener('touchstart', handleTouchStart, { passive: true });
            track.addEventListener('touchmove', handleTouchMove, { passive: true });
            track.addEventListener('touchend', handleTouchEnd);
        }

        // 初始化
        updateCarousel(container, currentIndex);
    });

    // 加入事件監聽
    if (isMobile) {
        // 手機版觸控事件
        lightboxImageContainer.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                handlePinch(e);
            } else if (e.touches.length === 1 && !isAnimating) {
                isMouseDown = true;
                handleDrag(e);
            }
        }, { passive: false });

        lightboxImageContainer.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                handlePinch(e);
            } else if (e.touches.length === 1 && !isAnimating) {
                handleDrag(e);
            }
        }, { passive: false });

        lightboxImageContainer.addEventListener('touchend', resetTouchState);
        lightboxImageContainer.addEventListener('touchcancel', resetTouchState);
    } else {
        // 電腦版滑鼠事件
        lightboxImageContainer.addEventListener('wheel', handleWheel, { passive: false });
        
        // 滑鼠按下事件
        lightboxImageContainer.addEventListener('mousedown', (e) => {
            if (!isAnimating) {
                isMouseDown = true;
                isDragging = false;
                lastX = e.clientX;
                lastY = e.clientY;
            }
        });

        // 滑鼠移動事件
        document.addEventListener('mousemove', handleDrag);

        // 滑鼠放開事件
        document.addEventListener('mouseup', resetTouchState);

        // 滑鼠離開視窗事件
        document.addEventListener('mouseleave', resetTouchState);
    }
});
