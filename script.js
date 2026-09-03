// Logo Intro Animation Control - Favicon Only
window.addEventListener('DOMContentLoaded', () => {
    const logoIntro = document.getElementById('logoIntro');
    const mainContent = document.getElementById('mainContent');

    // Hide main content initially
    mainContent.style.opacity = '0';

    // Remove intro overlay after animation completes
    setTimeout(() => {
        logoIntro.style.display = 'none';
    }, 3100);
});

// Button Click Handlers
document.querySelectorAll("button").forEach(button => {
    button.addEventListener("click", () => {
        const link = button.getAttribute("data-link");

        // Add click animation
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = '';
        }, 150);

        // Open link
        window.open(link, "_blank");
    });

    // Add ripple effect on click
    button.addEventListener('click', function (e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');

        this.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    });
});

// Add parallax effect to background elements
document.addEventListener('mousemove', (e) => {
    const circles = document.querySelectorAll('.bg-circle');
    const techIcons = document.querySelectorAll('.tech-icon');

    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;

    // Parallax for background circles
    circles.forEach((circle, index) => {
        const speed = (index + 1) * 20;
        const xOffset = (x - 0.5) * speed;
        const yOffset = (y - 0.5) * speed;
        circle.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
    });

    // Subtle parallax for tech icons
    techIcons.forEach((icon, index) => {
        const speed = (index + 1) * 10;
        const xOffset = (x - 0.5) * speed;
        const yOffset = (y - 0.5) * speed;
        // Use margin to not conflict with the transform-based float animation
        icon.style.marginLeft = `${xOffset}px`;
        icon.style.marginTop = `${yOffset}px`;
    });
});
