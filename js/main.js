// 滾動時觸發動畫
document.addEventListener('DOMContentLoaded', function() {
    const faders = document.querySelectorAll('.fade-in');

    const appearOptions = {
        threshold: 0.3,
        rootMargin: "0px 0px -50px 0px"
    };

    const appearOnScroll = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
            } else {
                entry.target.classList.remove('show');
            }
        });
    }, appearOptions);

    faders.forEach(fader => {
        appearOnScroll.observe(fader);
    });

    // 勝訴案例區域
    const tabs = document.querySelectorAll('.case-tab');
    const panels = document.querySelectorAll('.case-panel');

    function clearTabs() {
      tabs.forEach(tab => tab.classList.remove('active'));
      panels.forEach(panel => panel.classList.remove('show'));
    }

    tabs.forEach(tab => {
      tab.addEventListener('click', function() {
        const targetId = 'panel-' + this.dataset.target;
        clearTabs();
        this.classList.add('active');
        document.getElementById(targetId).classList.add('show');
      });
    });

    // 預設顯示第一個分類
    if (tabs.length > 0) {
      tabs[0].click();
    }


});


