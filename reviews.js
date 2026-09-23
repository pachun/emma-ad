const testimonials = document.querySelector('#selected-reviews');
const navigation = document.querySelector('.review-navigation');
const previous = navigation?.querySelector('[data-review-direction="-1"]');
const next = navigation?.querySelector('[data-review-direction="1"]');

if (testimonials && navigation && previous && next) {
  const updateNavigation = () => {
    const end = testimonials.scrollWidth - testimonials.clientWidth;
    const edgeTolerance = 2;
    navigation.hidden = end <= edgeTolerance;
    previous.disabled = testimonials.scrollLeft <= edgeTolerance;
    next.disabled = testimonials.scrollLeft >= end - edgeTolerance;
  };
  navigation.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (button) {
      const distance = testimonials.firstElementChild.getBoundingClientRect().width + parseFloat(getComputedStyle(testimonials).gap);
      testimonials.scrollBy({ left: Number(button.dataset.reviewDirection) * distance, behavior: 'instant' });
    }
  });
  testimonials.addEventListener('scroll', updateNavigation, { passive: true });
  new ResizeObserver(updateNavigation).observe(testimonials);
  updateNavigation();
}
