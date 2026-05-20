document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // MOBILE MENU TOGGLE
  // ==========================================
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      mobileMenu.classList.toggle('active');
    });

    // Close menu when clicking on a link
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        mobileMenu.classList.remove('active');
      });
    });
  }

  // ==========================================
  // SCROLL EFFECTS
  // ==========================================
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // ==========================================
  // NUMBER ANIMATION (STAT COUNTER)
  // ==========================================
  const stats = document.querySelectorAll('.stat-number');
  const observerOptions = {
    threshold: 0.5,
    rootMargin: '0px'
  };

  const statsObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target;
        const targetValue = parseInt(target.getAttribute('data-target'), 10);
        animateValue(target, 0, targetValue, 2000);
        observer.unobserve(target);
      }
    });
  }, observerOptions);

  stats.forEach(stat => statsObserver.observe(stat));

  function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      let currentValue;
      if (end > 1000) {
        // Format large numbers like 2M+
        currentValue = Math.floor(progress * (end - start) + start);
        if (currentValue >= 1000000) {
          obj.innerHTML = (currentValue / 1000000).toFixed(1) + 'M+';
        } else {
          obj.innerHTML = currentValue.toLocaleString();
        }
      } else {
        obj.innerHTML = Math.floor(progress * (end - start) + start);
      }
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }

  // ==========================================
  // MOCKUP PHONE SVG RING ANIMATION
  // ==========================================
  const ringFill = document.getElementById('ringFill');
  if (ringFill) {
    // 314 is the dasharray (2 * pi * r = 2 * 3.14 * 50 = 314)
    // We want to fill 68% of the ring (since 1420 kcal left out of 2100 is approx 68%)
    const pct = 0.68;
    const offset = 314 - (314 * pct);
    setTimeout(() => {
      ringFill.style.strokeDashoffset = offset;
    }, 500);
  }

  // ==========================================
  // INTERACTIVE DEMO (FOOD LOG SIMULATION)
  // ==========================================
  const scanButton = document.querySelector('.scan-btn-mock');
  const recentMealsContainer = document.querySelector('.recent-meals');
  const calorieVal = document.querySelector('.ring-cal');
  
  // Custom interactive tracking demo
  const sampleFoods = [
    { name: 'Avocado Toast 🥑', cal: 280, protein: 8, carbs: 32, fats: 14, emoji: '🥑' },
    { name: 'Protein Shake 🥛', cal: 180, protein: 30, carbs: 5, fats: 3, emoji: '🥛' },
    { name: 'Oatmeal & Berries 🥣', cal: 240, protein: 7, carbs: 45, fats: 4, emoji: '🥣' },
    { name: 'Grilled Salmon 🐟', cal: 340, protein: 34, carbs: 0, fats: 22, emoji: '🐟' },
    { name: 'Handful of Almonds 🥜', cal: 160, protein: 6, carbs: 6, fats: 14, emoji: '🥜' }
  ];

  let currentCalLeft = 1420;
  let proteinLogged = 86;
  let carbsLogged = 145;
  let fatsLogged = 32;

  if (scanButton && recentMealsContainer) {
    scanButton.addEventListener('click', () => {
      // Pick random food
      const food = sampleFoods[Math.floor(Math.random() * sampleFoods.length)];
      
      // Update values
      currentCalLeft = Math.max(0, currentCalLeft - food.cal);
      proteinLogged += food.protein;
      carbsLogged += food.carbs;
      fatsLogged += food.fats;

      // Create new food item chip with animation
      const mealChip = document.createElement('div');
      mealChip.className = 'meal-chip';
      mealChip.style.opacity = '0';
      mealChip.style.transform = 'translateY(10px)';
      mealChip.style.transition = 'all 0.3s ease-out';
      
      mealChip.innerHTML = `
        <span class="meal-emoji">${food.emoji}</span>
        <div>
          <span class="meal-name">${food.name}</span>
          <span class="meal-cal">+${food.cal} kcal</span>
        </div>
      `;

      // Prepend to show at the top of recent meals
      recentMealsContainer.insertBefore(mealChip, recentMealsContainer.firstChild);
      
      // Animate in
      setTimeout(() => {
        mealChip.style.opacity = '1';
        mealChip.style.transform = 'translateY(0)';
      }, 50);

      // Keep only last 3 items in the mockup list
      if (recentMealsContainer.children.length > 3) {
        recentMealsContainer.removeChild(recentMealsContainer.lastChild);
      }

      // Update Calorie Counter Text
      animateTextValue(calorieVal, parseInt(calorieVal.textContent.replace(/,/g, ''), 10), currentCalLeft, 800);

      // Update Ring Stroke Offset
      const totalGoal = 2100;
      const loggedPct = (totalGoal - currentCalLeft) / totalGoal;
      const newOffset = 314 - (314 * (1 - loggedPct));
      ringFill.style.strokeDashoffset = newOffset;

      // Update Macro Bars
      updateMacroBar('protein', proteinLogged, 150); // Protein goal: 150g
      updateMacroBar('carbs', carbsLogged, 250);     // Carbs goal: 250g
      updateMacroBar('fats', fatsLogged, 70);        // Fats goal: 70g

      // Visual feedback on button
      scanButton.style.transform = 'scale(0.95)';
      setTimeout(() => scanButton.style.transform = 'scale(1)', 100);
    });
  }

  function updateMacroBar(name, value, goal) {
    const bar = document.querySelector(`.${name}-bar`);
    const valText = bar.closest('.macro-row').querySelector('.macro-val');
    
    // Update value text
    valText.textContent = `${value}g`;
    
    // Update width pct
    const pct = Math.min(100, (value / goal) * 100);
    bar.style.width = `${pct}%`;
  }

  function animateTextValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const currentValue = Math.floor(progress * (end - start) + start);
      element.textContent = currentValue.toLocaleString();
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }

  // ==========================================
  // FLOATING CARD SCROLL EFFECT
  // ==========================================
  window.addEventListener('mousemove', (e) => {
    const floatCards = document.querySelectorAll('.float-card');
    const x = e.clientX / window.innerWidth - 0.5;
    const y = e.clientY / window.innerHeight - 0.5;

    floatCards.forEach(card => {
      const speed = card.classList.contains('float-card-1') ? 15 : card.classList.contains('float-card-2') ? 25 : 20;
      card.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
    });
  });
});
