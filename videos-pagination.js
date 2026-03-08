(function () {
    var pager = document.getElementById('videos-pager');
    if (!pager) return;

    var total = parseInt(pager.dataset.total, 10);
    var current = 0;
    var items = document.querySelectorAll('[data-vpage]');
    var grid = document.getElementById('videos-grid');
    var prevBtn = document.getElementById('prev-page');
    var nextBtn = document.getElementById('next-page');
    var info = document.getElementById('page-info');

    function showPage(n) {
        items.forEach(function (el) {
            el.style.display = (parseInt(el.dataset.vpage, 10) === n) ? '' : 'none';
        });
        current = n;
        info.textContent = 'Page ' + (n + 1) + ' of ' + total;
        prevBtn.disabled = (n === 0);
        nextBtn.disabled = (n === total - 1);
        grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    prevBtn.addEventListener('click', function () { if (current > 0) showPage(current - 1); });
    nextBtn.addEventListener('click', function () { if (current < total - 1) showPage(current + 1); });
})();
