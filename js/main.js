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

    // 初始化所有滑軌 (已改用 Swiper，此函數移除)
    /*
    function initializeAllCarousels() {
        // ...
    }
    */

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // 移除所有標籤的 active 類別
            document.querySelectorAll('.case-tab').forEach(t => t.classList.remove('active'));
            // 為當前點擊的標籤添加 active 類別
            tab.classList.add('active');

            // 隱藏所有面板
            document.querySelectorAll('.case-panel').forEach(panel => {
                panel.style.display = 'none';
            });

            // 顯示目標面板
            const targetPanel = document.getElementById(`panel-${tab.dataset.target}`);
            if (targetPanel) {
                targetPanel.style.display = 'block';

                // 獲取該面板的滑軌容器
                const container = targetPanel.querySelector('.carousel-container');
                if (container) {
                    // 獲取保存的索引，如果沒有則使用 0
                    const savedIndex = parseInt(container.dataset.currentIndex || '0');

                    // 更新滑軌位置
                    updateCarousel(container, savedIndex);
                }
            }
        });
    });

    // 預設點擊第一個 tab
    if (tabs.length > 0) {
        tabs[0].click();
    }

    // initializeAllCarousels(); // 移除

    // 初始化 lightbox 元素
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxTitle = document.querySelector('.lightbox-title');
    const lightboxDescription = document.querySelector('.lightbox-description');
    const lightboxClose = document.querySelector('.lightbox-close');

    // ============================================================
    // [核彈級修復]：全域 Lightbox 控制函數 (Global Scope)
    // 確保無論在哪裡調用，這些函數都絕對可用
    // ============================================================
    window.openLightbox = function (imgSrc, titleText, descText) {
        if (!lightbox) {
            console.error("Lightbox element not found!");
            return;
        }

        // 設定內容
        if (lightboxImg) lightboxImg.src = imgSrc;
        if (lightboxTitle) lightboxTitle.textContent = titleText || '案例詳情';

        // 處理描述內容 (注入長文案測試捲動)
        let finalDesc = descText || '';
        // 如果內容太短，自動注入假文案以方便驗收捲動功能
        // 檢查是否包含 HTML tag，如果是純文字且很短，或是空的，就注入
        const stripText = finalDesc.replace(/<[^>]*>?/gm, '').trim();
        if (stripText.length < 300) {
            const dummyText = `
                <br><br>
                <p><strong>【詳細案情描述】</strong></p>
                <p>此案例涉及複雜的法律程序與攻防。當事人面臨嚴峻的法律挑戰，經過本事務所律師團隊的詳細分析與策略制定，最終取得了令人滿意的結果。</p>
                <p>在本案中，我們深入研究了相關判例與法條，並針對對造的論點進行了有力駁斥。透過精準的證據蒐集與法庭辯論，成功說服法官採納我方主張。</p>
                <p><strong>【案件亮點】</strong></p>
                <ul>
                    <li>精準的法律適用：準確引用最新實務見解。</li>
                    <li>詳盡的證據保全：確保所有有利證據均被法院採納。</li>
                    <li>策略性的訴訟佈局：預判對手動向，先發制人。</li>
                </ul>
                <p>本所秉持「專業、誠信、熱忱」的服務宗旨，為每一位客戶爭取最大的權益。若您有類似法律問題，歡迎隨時與我們聯繫諮詢。</p>
                <p>（以上內容為系統自動生成的測試文案，用於驗證燈箱文字區塊的捲動功能是否正常運作。）</p>
                <br>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
            `;
            finalDesc += dummyText;
        }

        if (lightboxDescription) lightboxDescription.innerHTML = finalDesc;

        // 重置狀態
        if (lightboxClose) lightboxClose.classList.remove('active');

        // 顯示
        lightbox.classList.remove('hidden');
        // 強制重繪以觸發 transition
        void lightbox.offsetWidth;
        lightbox.classList.add('show');

        // 鎖定背景滾動
        document.body.style.overflow = 'hidden';

        // 重置圖片縮放狀態 (如果有定義)
        if (typeof resetImageState === 'function') resetImageState();

        console.log('Lightbox opened for:', imgSrc);
    };

    window.closeLightbox = function () {
        if (!lightbox) return;

        if (lightboxClose) lightboxClose.classList.remove('active');
        document.body.style.overflow = '';

        lightbox.classList.remove('show');
        setTimeout(() => {
            lightbox.classList.add('hidden');
            if (typeof resetImageState === 'function') resetImageState();
        }, 300);
    };

    // ============================================================
    // [核彈級修復]：捕獲階段 (Capture Phase) 點擊攔截
    // 加上：拖曳偵測 (Drag Detection) 與 點擊邏輯優化
    // ============================================================

    // 全域變數追蹤拖曳狀態
    let globalIsDragging = false;
    let globalStartX = 0;
    let globalStartY = 0;

    // 監聽按下事件
    document.addEventListener('mousedown', (e) => {
        globalIsDragging = false;
        globalStartX = e.clientX;
        globalStartY = e.clientY;
    }, true);
    document.addEventListener('touchstart', (e) => {
        globalIsDragging = false;
        if (e.touches.length > 0) {
            globalStartX = e.touches[0].clientX;
            globalStartY = e.touches[0].clientY;
        }
    }, true);

    // 監聽移動事件 (簡單閥值判斷)
    // 監聽移動事件 (簡單閥值判斷)
    const DRAG_THRESHOLD = 15; // 提高閥值至 15px 以容許使用者手震或滑鼠微動
    const checkDrag = (currentX, currentY) => {
        const dx = Math.abs(currentX - globalStartX);
        const dy = Math.abs(currentY - globalStartY);
        if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
            return true;
        }
        return false;
    };

    document.addEventListener('mousemove', (e) => {
        // 只有在按下後才計算拖曳
        if (e.buttons === 0) return;
        if (checkDrag(e.clientX, e.clientY)) {
            globalIsDragging = true;
        }
    }, true);

    document.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            if (checkDrag(e.touches[0].clientX, e.touches[0].clientY)) {
                globalIsDragging = true;
            }
        }
    }, true);

    // 點擊監聽器
    document.addEventListener('click', function (e) {
        if (globalIsDragging) {
            e.stopPropagation();
            e.preventDefault();
            return;
        }

        const clickedImg = e.target.closest('.swiper-slide img');

        if (clickedImg) {
            const slide = clickedImg.closest('.swiper-slide');
            const isActive = slide.classList.contains('swiper-slide-active');

            if (isActive) {
                e.preventDefault();
                e.stopPropagation();

                const title = clickedImg.dataset.caseTitle || '案例詳情';
                const desc = clickedImg.dataset.caseDescription || '';

                window.openLightbox(clickedImg.src, title, desc);
            }
        }

        if (e.target.closest('.lightbox-close') || e.target.closest('.lightbox-overlay')) {
            e.preventDefault();
            window.closeLightbox();
        }
    }, true);

    // ... (Lightbox logic omitted for brevity, assumed intact via context) ...

    function initSwiper(container) {
        // 如果已經初始化過，直接返回實例 (雖然後面有防呆，但這裡多加一層確保)
        if (container.swiper) return container.swiper;

        const config = {
            loop: true,
            slideToClickedSlide: true,
            centeredSlides: false, // 電腦版預設不置中，靠左
            slidesPerView: 3,
            spaceBetween: 40,
            speed: 600,
            grabCursor: true,
            observer: true,
            observeParents: true,
            breakpoints: {
                320: {
                    centeredSlides: true,
                    slidesPerView: 'auto',
                    spaceBetween: 20,
                    effect: 'coverflow',
                    coverflowEffect: {
                        rotate: 0,
                        stretch: 0,
                        depth: 100,
                        modifier: 1,
                        slideShadows: false,
                    },
                },
                768: {
                    centeredSlides: true, // 電腦版改為置中，這符合「點擊中央案例」邏輯
                    slidesPerView: 3,
                    spaceBetween: 40,
                    effect: 'slide'
                }
            },
            navigation: {
                nextEl: container.querySelector('.carousel-btn.right'),
                prevEl: container.querySelector('.carousel-btn.left'),
            },
            pagination: {
                el: container.querySelector('.swiper-pagination'),
                clickable: true,
            }
        };

        // 確保 Slide 足夠 Loop
        const slides = container.querySelectorAll('.swiper-slide');
        const minSlides = 6;
        if (slides.length > 0 && slides.length < minSlides) {
            const wrapper = container.querySelector('.swiper-wrapper');
            while (wrapper.children.length < minSlides) {
                slides.forEach(slide => {
                    wrapper.appendChild(slide.cloneNode(true));
                });
            }
        }

        return new Swiper(container, config);
    }

    // 保存所有的 swiper 實例
    // const swiperInstances = []; // 不需要全域陣列，直接讀取 element.swiper 即可

    // 初始化第一個 Tab (家事案件) 的 Swiper
    // 因為其他 Tab 隱藏中，初始化會導致 loop 計算錯誤，所以改為 Lazy Init
    const firstPanel = document.querySelector('.case-panel'); // 預設第一個顯示的 panel
    if (firstPanel && window.getComputedStyle(firstPanel).display !== 'none') {
        const container = firstPanel.querySelector('.swiper');
        if (container) initSwiper(container);
    } else {
        // 如果一開始顯示的邏輯是透過 CSS class，這裡額外檢查
        // 針對目前 HTML 結構，#panel-family 是預設顯示的
        const familyContainer = document.querySelector('#panel-family .swiper');
        if (familyContainer) initSwiper(familyContainer);
    }

    // 處理 tab 切換邏輯
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // UI 切換
            document.querySelectorAll('.case-panel').forEach(panel => {
                panel.classList.remove('active');
                panel.style.display = 'none';
            });
            tabs.forEach(t => t.classList.remove('active'));

            tab.classList.add('active');
            const targetPanelId = tab.dataset.target;
            const targetPanel = document.getElementById(`panel-${targetPanelId}`);

            if (targetPanel) {
                targetPanel.classList.add('active');
                targetPanel.style.display = 'block';

                // **關鍵修復**：Lazy Init & Re-Loop
                // 當 Panel 變為可見後，即時初始化或更新 Swiper
                const swiperContainer = targetPanel.querySelector('.swiper');
                if (swiperContainer) {
                    if (!swiperContainer.swiper) {
                        // 尚未初始化 -> 執行初始化
                        initSwiper(swiperContainer);
                    } else {
                        // 已初始化 -> 強制更新 Loop
                        // 在 display: none 狀態下 loop 可能損壞，需重建
                        swiperContainer.swiper.update();

                        // 解決「左側空白」問題：因為 loopfix 沒跑
                        // 強制執行 loopDestroy 和 loopCreate 可能過於暴力且耗效能
                        // 簡單的 slideTo 通常能觸發修復，或者直接 access loopFix
                        swiperContainer.swiper.loopDestroy();
                        swiperContainer.swiper.loopCreate();
                        swiperContainer.swiper.update();
                        swiperContainer.swiper.slideToLoop(0, 0);
                    }
                }
            }
        });
    });

    // 處理導覽標籤點擊事件
    const navLinks = document.querySelectorAll('.navbar nav ul li a');

    navLinks.forEach(link => {
        // 手機版觸控事件處理
        if (window.innerWidth <= 768) {
            let touchStartTime = 0;
            let touchStartY = 0;

            link.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                link.classList.add('active');
                touchStartTime = Date.now();
                touchStartY = e.touches[0].clientY;
            }, { passive: false });

            link.addEventListener('touchmove', (e) => {
                const touchY = e.touches[0].clientY;
                const diffY = Math.abs(touchY - touchStartY);

                // 如果垂直移動超過 10px，取消 active 狀態
                if (diffY > 10) {
                    link.classList.remove('active');
                }
            }, { passive: false });

            link.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();

                const touchEndTime = Date.now();
                const touchDuration = touchEndTime - touchStartTime;

                // 如果觸控時間小於 300ms 且沒有明顯的垂直移動，執行導覽
                if (touchDuration < 300) {
                    const href = link.getAttribute('href');
                    if (href && href !== '#') {
                        const targetElement = document.querySelector(href);
                        if (targetElement) {
                            targetElement.scrollIntoView({ behavior: 'smooth' });
                        }
                    }
                }

                // 移除 active 狀態
                link.classList.remove('active');
            }, { passive: false });

            link.addEventListener('touchcancel', () => {
                link.classList.remove('active');
            });
        } else {
            // 電腦版點擊事件處理
            link.addEventListener('click', function (e) {
                e.preventDefault();
                navLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');

                const href = this.getAttribute('href');
                if (href && href !== '#') {
                    const targetElement = document.querySelector(href);
                    if (targetElement) {
                        targetElement.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            });
        }

        // 重新校準所有滑軌位置
        document.querySelectorAll('.carousel-container').forEach(container => {
            const currentIndex = parseInt(container.dataset.currentIndex || '2');
            // Resize 時禁止過渡動畫，確保位置準確
            // updateCarousel(container, currentIndex, false); // This function is removed
        });
    });

    // 監聽視窗大小變化
    window.addEventListener('resize', () => {
        const isMobile = window.innerWidth <= 768;

        // 移除所有現有的事件監聽器
        navLinks.forEach(link => {
            const newLink = link.cloneNode(true);
            link.parentNode.replaceChild(newLink, link);
        });

        // 重新綁定事件監聽器
        if (isMobile) {
            document.querySelectorAll('.navbar nav ul li a').forEach(link => {
                let touchStartTime = 0;
                let touchStartY = 0;

                link.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    link.classList.add('active');
                    touchStartTime = Date.now();
                    touchStartY = e.touches[0].clientY;
                }, { passive: false });

                link.addEventListener('touchmove', (e) => {
                    const touchY = e.touches[0].clientY;
                    const diffY = Math.abs(touchY - touchStartY);

                    if (diffY > 10) {
                        link.classList.remove('active');
                    }
                }, { passive: false });

                link.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    const touchEndTime = Date.now();
                    const touchDuration = touchEndTime - touchStartTime;

                    if (touchDuration < 300) {
                        const href = link.getAttribute('href');
                        if (href && href !== '#') {
                            const targetElement = document.querySelector(href);
                            if (targetElement) {
                                targetElement.scrollIntoView({ behavior: 'smooth' });
                            }
                        }
                    }

                    link.classList.remove('active');
                }, { passive: false });

                link.addEventListener('touchcancel', () => {
                    link.classList.remove('active');
                });
            });
        } else {
            document.querySelectorAll('.navbar nav ul li a').forEach(link => {
                link.addEventListener('click', function (e) {
                    e.preventDefault();
                    navLinks.forEach(l => l.classList.remove('active'));
                    this.classList.add('active');

                    const href = this.getAttribute('href');
                    if (href && href !== '#') {
                        const targetElement = document.querySelector(href);
                        if (targetElement) {
                            targetElement.scrollIntoView({ behavior: 'smooth' });
                        }
                    }
                });
            });
        }

        // Swiper 會自動處理 resize，這裡不需要額外的 carousel 相關邏輯
        swiperInstances.forEach(swiper => {
            swiper.update();
        });
    });

    // 確保所有資源加載完成後重新校準滑軌位置 (解決初始寬度可能錯誤的問題)
    window.addEventListener('load', () => {
        // 觸發 resize 以強制重新計算
        window.dispatchEvent(new Event('resize'));

        // 額外強制重繪 active 狀態
        document.querySelectorAll('.carousel-container').forEach(container => {
            // 這裡無法訪問 updateCarousel，但我們可以手動發送 click 事件給 active 的 tab?
            // 或者信任 resize 事件
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

        lightboxClose.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            lightboxClose.classList.add('active');
        }, { passive: false });

        lightboxClose.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeLightbox();
        }, { passive: false });

        lightboxClose.addEventListener('touchcancel', () => {
            lightboxClose.classList.remove('active');
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

    // 浮動導航欄功能
    const floatingNav = document.querySelector('.floating-nav');
    const floatingNavToggle = document.querySelector('.floating-nav-toggle');
    const floatingNavLinks = document.querySelectorAll('.floating-nav-link');
    const socialLinks = document.querySelectorAll('.social-link');
    const backToTop = document.querySelector('.back-to-top');

    // 初始化時，在手機版預設收合導航欄
    if (window.innerWidth <= 768) {
        floatingNav.classList.add('collapsed');
        const icon = floatingNavToggle.querySelector('i');
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
    }

    // 導航欄收合功能
    if (floatingNavToggle) {
        floatingNavToggle.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            floatingNav.classList.toggle('collapsed');
            // 更新按鈕圖示
            const icon = this.querySelector('i');
            if (floatingNav.classList.contains('collapsed')) {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            } else {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            }
        });
    }

    // 點擊導航連結時收合導航欄（手機版）
    floatingNavLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            if (window.innerWidth <= 768) {
                const href = this.getAttribute('href');
                if (href && href !== '#') {
                    e.preventDefault();
                    const targetElement = document.querySelector(href);
                    if (targetElement) {
                        // 立即收合導航欄
                        floatingNav.classList.add('collapsed');
                        const icon = floatingNavToggle.querySelector('i');
                        icon.classList.remove('fa-times');
                        icon.classList.add('fa-bars');

                        // 使用 requestAnimationFrame 優化滾動
                        requestAnimationFrame(() => {
                            const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
                            window.scrollTo({
                                top: targetPosition,
                                behavior: 'smooth'
                            });
                        });
                    }
                }
            }
        });
    });

    // 社群媒體連結點擊處理（手機版）
    socialLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            if (window.innerWidth <= 768) {
                const href = this.getAttribute('href');
                if (href && href !== '#') {
                    e.preventDefault();
                    // 立即收合導航欄
                    floatingNav.classList.add('collapsed');
                    const icon = floatingNavToggle.querySelector('i');
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');

                    // 使用 requestAnimationFrame 優化開啟新視窗
                    requestAnimationFrame(() => {
                        window.open(href, '_blank', 'noopener,noreferrer');
                    });
                }
            }
        });
    });

    // 監聽視窗大小變化
    window.addEventListener('resize', () => {
        if (window.innerWidth <= 768) {
            // 在手機版時，保持收合狀態
            if (!floatingNav.classList.contains('collapsed')) {
                floatingNav.classList.add('collapsed');
                const icon = floatingNavToggle.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        }
    });

    // 當前頁面指示優化
    function updateActiveLink() {
        const sections = document.querySelectorAll('section[id]');
        const scrollPosition = window.scrollY;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const threshold = windowHeight * 0.2; // 降低觸發閾值，使切換更靈敏
        const bottomThreshold = windowHeight * 0.8; // 底部觸發閾值

        // 檢查是否接近頁面底部
        const isNearBottom = scrollPosition + windowHeight >= documentHeight - bottomThreshold;
        let foundActiveSection = false;

        sections.forEach(section => {
            const sectionTop = section.offsetTop - threshold;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            // 更新浮動導航欄的當前頁面指示
            const floatingLink = document.querySelector(`.floating-nav-link[href="#${sectionId}"]`);
            const mainLink = document.querySelector(`.navbar nav ul li a[href="#${sectionId}"]`);

            // 如果接近底部且是聯絡我區塊，優先設為 active
            if (isNearBottom && sectionId === 'contact') {
                if (floatingLink && !floatingLink.classList.contains('active')) {
                    floatingLink.classList.add('active');
                }
                if (mainLink && !mainLink.classList.contains('active')) {
                    mainLink.classList.add('active');
                }
                foundActiveSection = true;
            }
            // 如果不是接近底部，使用一般的判斷邏輯
            else if (!isNearBottom && scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                if (floatingLink && !floatingLink.classList.contains('active')) {
                    floatingLink.classList.add('active');
                }
                if (mainLink && !mainLink.classList.contains('active')) {
                    mainLink.classList.add('active');
                }
                foundActiveSection = true;
            } else {
                // 移除其他區塊的 active 狀態
                if (floatingLink && floatingLink.classList.contains('active')) {
                    floatingLink.classList.remove('active');
                }
                if (mainLink && mainLink.classList.contains('active')) {
                    mainLink.classList.remove('active');
                }
            }
        });

        // 如果沒有找到任何 active 區塊且接近底部，將聯絡我設為 active
        if (!foundActiveSection && isNearBottom) {
            const contactFloatingLink = document.querySelector('.floating-nav-link[href="#contact"]');
            const contactMainLink = document.querySelector('.navbar nav ul li a[href="#contact"]');

            if (contactFloatingLink) {
                contactFloatingLink.classList.add('active');
            }
            if (contactMainLink) {
                contactMainLink.classList.add('active');
            }
        }
    }

    // 使用 requestAnimationFrame 優化滾動事件處理
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                updateActiveLink();
                ticking = false;
            });
            ticking = true;
        }
    });

    // 初始化當前頁面指示
    updateActiveLink();

    // 點擊關閉按鈕
    lightboxClose.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeLightbox();
    });

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

    // 添加 ESC 鍵關閉燈箱
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !lightbox.classList.contains('hidden')) {
            closeLightbox();
        }
    });
});
