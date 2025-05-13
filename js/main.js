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

    // 新增變數用於優化效能
    let rafId = null;
    let lastTimestamp = 0;
    const frameInterval = 1000 / 60; // 目標 60fps

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
        
        // 計算移動距離
        const moveDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // 如果移動距離太小，不進行拖曳
        if (moveDistance < 1) return;
        
        const imgRect = lightboxImg.getBoundingClientRect();
        const containerRect = lightboxImageContainer.getBoundingClientRect();
        const scaledWidth = imgRect.width;
        const scaledHeight = imgRect.height;
        
        // 計算最大可移動範圍
        const maxX = Math.max(0, (scaledWidth - containerRect.width) / 2);
        const maxY = Math.max(0, (scaledHeight - containerRect.height) / 2);
        
        // 更新位置，允許超出邊界
        translateX += deltaX;
        translateY += deltaY;
        
        // 在最小縮放狀態下，使用較小的移動範圍
        if (scale === 1) {
            const maxOffset = 50; // 最小縮放狀態下的最大偏移量
            translateX = Math.max(-maxOffset, Math.min(maxOffset, translateX));
            translateY = Math.max(-maxOffset, Math.min(maxOffset, translateY));
        } else {
            // 放大狀態下，允許更大的拖曳範圍
            const damping = 0.3; // 阻尼係數
            
            // 分別設定水平和垂直方向的基礎溢出限制
            const baseOverflowX = 200; // 水平方向的基礎溢出限制
            const baseOverflowY = 250; // 垂直方向的基礎溢出限制
            const scaleFactor = Math.min(scale, 3); // 增加縮放係數範圍
            const overflowLimitX = baseOverflowX * scaleFactor;
            const overflowLimitY = baseOverflowY * scaleFactor;
            
            // 計算超出邊界的距離
            const overflowX = Math.abs(translateX) - maxX;
            const overflowY = Math.abs(translateY) - maxY;
            
            // 如果超出邊界，增加阻尼效果
            if (overflowX > baseOverflowX) {
                const limitedOverflow = Math.min(overflowX, overflowLimitX);
                translateX = Math.sign(translateX) * (maxX + limitedOverflow * damping);
            }
            if (overflowY > baseOverflowY) {
                const limitedOverflow = Math.min(overflowY, overflowLimitY);
                translateY = Math.sign(translateY) * (maxY + limitedOverflow * damping);
            }
        }
        
        // 更新圖片位置
        lightboxImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        
        lastX = touch.clientX;
        lastY = touch.clientY;
    }

    // 重置觸控狀態並處理回彈
    function resetTouchState() {
        const imgRect = lightboxImg.getBoundingClientRect();
        const containerRect = lightboxImageContainer.getBoundingClientRect();
        const scaledWidth = imgRect.width;
        const scaledHeight = imgRect.height;
        
        // 計算最大可移動範圍
        const maxX = Math.max(0, (scaledWidth - containerRect.width) / 2);
        const maxY = Math.max(0, (scaledHeight - containerRect.height) / 2);
        
        // 計算當前位置到邊界的距離
        const distanceToBoundaryX = Math.abs(translateX) - maxX;
        const distanceToBoundaryY = Math.abs(translateY) - maxY;
        
        // 檢查是否需要回彈（只要超出邊界就需要回彈）
        const needsRebound = scale === 1 || 
            (distanceToBoundaryX > 0) || 
            (distanceToBoundaryY > 0);
        
        if (needsRebound) {
            isAnimating = true;
            
            // 根據縮放比例調整動畫時間
            const animationDuration = scale === 1 ? 200 : 300;
            lightboxImg.style.transition = `transform ${animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
            
            if (scale === 1) {
                // 最小縮放狀態下回到中心
                translateX = 0;
                translateY = 0;
            } else {
                // 放大狀態下回到最近的邊界
                // 根據當前位置決定回彈方向
                if (translateX > maxX) {
                    translateX = maxX;
                } else if (translateX < -maxX) {
                    translateX = -maxX;
                }
                
                if (translateY > maxY) {
                    translateY = maxY;
                } else if (translateY < -maxY) {
                    translateY = -maxY;
                }
            }
            
            // 使用 requestAnimationFrame 確保動畫流暢
            rafId = requestAnimationFrame(() => {
                lightboxImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
            });
            
            // 動畫結束後清理
            setTimeout(() => {
                cleanup();
                lightboxImg.style.transition = '';
                isAnimating = false;
            }, animationDuration);
        } else {
            // 如果不需要回彈，直接清理狀態
            cleanup();
        }
        
        // 重置所有狀態
        startDistance = 0;
        currentDistance = 0;
        isDragging = false;
        isMouseDown = false;
        lastX = 0;
        lastY = 0;
    }

    // 處理縮放
    function handleZoom(newScale) {
        const oldScale = scale;
        scale = Math.max(1, Math.min(3, newScale));
        
        if (scale !== oldScale) {
            const imgRect = lightboxImg.getBoundingClientRect();
            const containerRect = lightboxImageContainer.getBoundingClientRect();
            
            // 如果縮放到最小，使用較快的動畫
            const animationDuration = scale === 1 ? 200 : 300;
            lightboxImg.style.transition = `transform ${animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
            
            if (scale === 1) {
                translateX = 0;
                translateY = 0;
            } else {
                // 計算新的最大可移動範圍
                const maxX = (imgRect.width * scale - containerRect.width) / 2;
                const maxY = (imgRect.height * scale - containerRect.height) / 2;
                
                // 確保圖片在縮放後不會超出邊界
                translateX = Math.max(-maxX, Math.min(maxX, translateX));
                translateY = Math.max(-maxY, Math.min(maxY, translateY));
            }
            
            // 使用 requestAnimationFrame 確保動畫流暢
            rafId = requestAnimationFrame(() => {
                lightboxImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
            });
            
            // 動畫結束後清理
            setTimeout(() => {
                cleanup();
                lightboxImg.style.transition = '';
            }, animationDuration);
        }
    }

    // 處理雙指縮放
    function handlePinch(e) {
        // 檢查是否為模擬的觸控事件（開發者工具中的滾輪事件）
        if (e.type === 'wheel' && e.ctrlKey) {
            e.preventDefault();
            const delta = e.deltaY;
            const zoomFactor = delta > 0 ? 0.9 : 1.1;
            handleZoom(scale * zoomFactor);
            return;
        }

        // 原有的觸控事件處理
        if (e.touches && e.touches.length === 2) {
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

    // 電腦版的點擊處理
    function handleDesktopClick(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const img = e.target;
        const carouselItem = img.closest('.carousel-item');
        const isActive = carouselItem.classList.contains('active');
        const container = carouselItem.closest('.carousel-container');
        const items = container.querySelectorAll('.carousel-item');
        const index = parseInt(carouselItem.dataset.index);
        
        if (isActive) {
            // 如果是 active 案例，開啟燈箱
            openLightbox(img.src);
        } else {
            // 如果不是 active 案例，切換到該案例
            const track = container.querySelector('.carousel-track');
            const itemWidth = items[0].offsetWidth;
            const gap = parseInt(getComputedStyle(track).gap) || 0;
            const fullItemWidth = itemWidth + gap;
            const containerWidth = container.offsetWidth;
            
            // 計算新的偏移量
            const offset = (fullItemWidth * index) - (containerWidth / 2) + (itemWidth / 2);
            
            // 添加過渡效果
            track.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            track.style.transform = `translateX(${-offset}px)`;
            
            // 更新 active 狀態
            items.forEach(item => item.classList.remove('active'));
            carouselItem.classList.add('active');
        }
    }

    // 手機版的觸控處理
    function handleMobileTouch(e) {
        const touch = e.touches[0];
        const activeItem = items[currentIndex];
        const activeImg = activeItem.querySelector('img');
        if (activeImg) {
            const rect = activeImg.getBoundingClientRect();
            const isClickOnActiveImg = 
                touch.clientX >= rect.left && 
                touch.clientX <= rect.right && 
                touch.clientY >= rect.top && 
                touch.clientY <= rect.bottom;
            
            // 儲存點擊位置資訊
            e.target.dataset.clickedOnActive = isClickOnActiveImg;
        }
    }

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
    
        // 先移除所有項目的 active 類別
        items.forEach(item => {
            item.classList.remove('active');
        });
        
        // 使用 requestAnimationFrame 確保動畫流暢
        requestAnimationFrame(() => {
            track.style.transform = `translateX(${-offset}px)`;
            
            // 在 transform 動畫開始後，添加 active 類別
            setTimeout(() => {
                items[currentIndex].classList.add('active');
            }, 50);
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
        let touchStartTarget = null;
        let touchStartActiveImg = null;

        // 根據螢幕寬度設置事件監聽器
        if (window.innerWidth > 768) {
            // 電腦版：使用點擊事件
            items.forEach(item => {
                const img = item.querySelector('img');
                img.addEventListener('click', handleDesktopClick);
            });
        } else {
            // 手機版：使用觸控事件
            track.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                currentX = startX;
                currentY = startY;
                touchStartTime = Date.now();
                isDragging = false;
                hasMoved = false;
                track.style.transition = 'none';
                touchStartTarget = e.target;

                // 檢查點擊位置是否在 active case 上
                const touch = e.touches[0];
                const activeItem = items[currentIndex];
                const activeImg = activeItem.querySelector('img');
                if (activeImg) {
                    const rect = activeImg.getBoundingClientRect();
                    touchStartActiveImg = 
                        touch.clientX >= rect.left && 
                        touch.clientX <= rect.right && 
                        touch.clientY >= rect.top && 
                        touch.clientY <= rect.bottom;
                }
            }, { passive: true });

            track.addEventListener('touchmove', (e) => {
                if (!startX) return;
                
                currentX = e.touches[0].clientX;
                currentY = e.touches[0].clientY;
                
                const diffX = currentX - startX;
                const diffY = currentY - startY;
                
                const distance = Math.sqrt(diffX * diffX + diffY * diffY);
                
                if (distance > 10) {
                    hasMoved = true;
                    isDragging = true;
                    touchStartActiveImg = false;
                }
                
                if (isDragging) {
                    const itemWidth = items[0].offsetWidth;
                    const gap = parseInt(getComputedStyle(track).gap) || 0;
                    const fullItemWidth = itemWidth + gap;
                    const containerWidth = container.offsetWidth;
                    
                    let currentOffset = currentIndex * fullItemWidth;
                    const newOffset = currentOffset - diffX;
                    track.style.transform = `translateX(${-newOffset}px)`;
                }
            }, { passive: true });

            track.addEventListener('touchend', (e) => {
                if (!startX) return;
                
                touchEndTime = Date.now();
                const touchDuration = touchEndTime - touchStartTime;
                const diffX = currentX - startX;
                
                startX = 0;
                currentX = 0;
                startY = 0;
                currentY = 0;
                
                if (isDragging) {
                    track.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                    
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
                } else if (!hasMoved && touchDuration < 300 && touchStartTarget === e.target) {
                    if (touchStartActiveImg) {
                        const activeItem = items[currentIndex];
                        const activeImg = activeItem.querySelector('img');
                        if (activeImg) {
                            e.preventDefault();
                            e.stopPropagation();
                            openLightbox(activeImg.src);
                        }
                    } else {
                        const touch = e.changedTouches[0];
                        const containerRect = container.getBoundingClientRect();
                        const containerCenter = containerRect.left + containerRect.width / 2;
                        
                        let newIndex = currentIndex;
                        if (touch.clientX < containerCenter && currentIndex > 0) {
                            newIndex = currentIndex - 1;
                        } else if (touch.clientX > containerCenter && currentIndex < items.length - 1) {
                            newIndex = currentIndex + 1;
                        }
                        
                        if (newIndex !== currentIndex) {
                            currentIndex = newIndex;
                            track.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                            updateCarousel(container, currentIndex);
                        }
                    }
                }
                
                touchStartActiveImg = null;
                touchStartTarget = null;
                isDragging = false;
                hasMoved = false;
            });
        }

        // 保留原有的按鈕點擊事件
        leftBtn?.addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + items.length) % items.length;
            updateCarousel(container, currentIndex);
        });

        rightBtn?.addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % items.length;
            updateCarousel(container, currentIndex);
        });

        // 初始化
        updateCarousel(container, currentIndex);
    });

    // 監聽視窗大小變化，重新設置事件監聽器
    window.addEventListener('resize', () => {
        const isMobile = window.innerWidth <= 768;
        document.querySelectorAll('.carousel-container').forEach(container => {
            const items = container.querySelectorAll('.carousel-item');
            const track = container.querySelector('.carousel-track');
            
            // 移除所有現有的事件監聽器
            items.forEach(item => {
                const img = item.querySelector('img');
                img.replaceWith(img.cloneNode(true));
            });
            
            // 重新綁定事件監聽器
            if (isMobile) {
                // 手機版的事件監聽器會在容器初始化時重新綁定
                container.querySelectorAll('.carousel-item img').forEach(img => {
                    img.addEventListener('click', (e) => e.preventDefault());
                });
            } else {
                // 電腦版的事件監聽器
                container.querySelectorAll('.carousel-item img').forEach(img => {
                    img.addEventListener('click', handleDesktopClick);
                });
            }
        });
    });

    // 在事件監聽器中加入清理邏輯
    function cleanup() {
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    }

    // 修改事件監聽器
    if (isMobile) {
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

        // 加入滾輪事件監聽（用於開發者工具中的模擬觸控）
        lightboxImageContainer.addEventListener('wheel', (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                const delta = e.deltaY;
                const zoomFactor = delta > 0 ? 0.9 : 1.1;
                handleZoom(scale * zoomFactor);
            }
        }, { passive: false });

        lightboxImageContainer.addEventListener('touchend', () => {
            if (isMouseDown) {
                resetTouchState();
            }
        });

        lightboxImageContainer.addEventListener('touchcancel', () => {
            if (isMouseDown) {
                resetTouchState();
            }
        });
    } else {
        // 電腦版滑鼠事件
        lightboxImageContainer.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY;
            const zoomFactor = delta > 0 ? 0.9 : 1.1;
            handleZoom(scale * zoomFactor);
        }, { passive: false });

        lightboxImageContainer.addEventListener('mousedown', (e) => {
            if (!isAnimating) {
                isMouseDown = true;
                isDragging = false;
                lastX = e.clientX;
                lastY = e.clientY;
            }
        });

        document.addEventListener('mousemove', handleDrag);

        document.addEventListener('mouseup', () => {
            if (isMouseDown) {
                resetTouchState();
            }
        });

        document.addEventListener('mouseleave', () => {
            if (isMouseDown) {
                resetTouchState();
            }
        });
    }
});
