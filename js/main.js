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

        // 更新滑軌位置與 active 樣式
        function updateCarousel() {
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

        // 顯示燈箱
        function showLightbox(img) {
            lightboxImg.src = img.src;
            lightbox.classList.remove('hidden');
            requestAnimationFrame(() => {
                lightbox.classList.add('show');
            });
        }

        // 點擊圖片處理（電腦版）
        items.forEach((item, index) => {
            const img = item.querySelector('img');
            img?.addEventListener('click', (e) => {
                e.stopPropagation();
                if (currentIndex !== index) {
                    currentIndex = index;
                    updateCarousel();
                } else {
                    showLightbox(img);
                }
            });
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
                
                updateCarousel();
            } else if (!hasMoved && touchDuration < 10) {
                // 短時間觸摸且沒有明顯移動時，顯示燈箱
                const activeItem = items[currentIndex];
                const activeImg = activeItem.querySelector('img');
                if (activeImg) {
                    showLightbox(activeImg);
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

        // 保留原有的點擊事件處理
        leftBtn?.addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + items.length) % items.length;
            updateCarousel();
        });

        rightBtn?.addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % items.length;
            updateCarousel();
        });

        // 燈箱關閉處理
        lightbox?.addEventListener('click', () => {
            lightbox.classList.remove('show');
            setTimeout(() => {
                lightbox.classList.add('hidden');
            }, 300);
        });

        updateCarousel();
    });
});
