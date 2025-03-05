let lastScrollTop = 0;

function handleScroll() {
    const scrollTop = window.scrollY;
    const navbar = document.querySelector('.navbar');

    if (scrollTop > lastScrollTop) {
        // Scrolling down
        navbar.classList.add('hidden');
    } else {
        // Scrolling up
        navbar.classList.remove('hidden');
    }

    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
}

window.addEventListener('scroll', handleScroll);
