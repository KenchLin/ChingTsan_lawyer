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

    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('show'));

            const targetId = 'panel-' + this.dataset.target;
            this.classList.add('active');
            document.getElementById(targetId)?.classList.add('show');
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

        // 更新滑軌位置與 active 樣式
        function updateCarousel() {
            const itemWidth = items[0].offsetWidth + 40;
            const containerWidth = container.offsetWidth;
            const offset = (itemWidth * currentIndex) - (containerWidth - itemWidth) / 2;

            track.style.transform = `translateX(${-offset}px)`;

            items.forEach((item, index) => {
                item.classList.toggle('active', index === currentIndex);
            });
        }

        // 左右按鈕
        leftBtn?.addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + items.length) % items.length;
            updateCarousel();
        });

        rightBtn?.addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % items.length;
            updateCarousel();
        });

        // 點擊圖片：若未選中先置中，若已選中開啟燈箱
        items.forEach((item, index) => {
            const img = item.querySelector('img');
            img?.addEventListener('click', () => {
                if (currentIndex !== index) {
                    currentIndex = index;
                    updateCarousel();
                } else {
                    lightboxImg.src = img.src;
                    lightbox.classList.remove('hidden');
                    lightbox.classList.add('show');
                }
            });
        });

        updateCarousel();
    });

    // 點擊燈箱背景關閉
    lightbox?.addEventListener('click', () => {
        lightbox.classList.remove('show');
        setTimeout(() => {
            lightbox.classList.add('hidden');
        }, 300);
    });
});
