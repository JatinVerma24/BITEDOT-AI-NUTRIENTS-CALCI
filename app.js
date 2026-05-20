import confetti from 'canvas-confetti';

document.addEventListener('DOMContentLoaded', () => {
  
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  let localDiary = JSON.parse(localStorage.getItem('bite_diary')) || [];
  
  const GOALS = {
    calories: 2100,
    protein: 150,
    carbs: 250,
    fats: 70
  };

  let currentStream = null;
  let activeFacingMode = 'user'; // 'user' (front) or 'environment' (back)
  let activeTab = 'scanner'; // 'scanner' or 'upload'
  let selectedFile = null;
  let activeFoodResult = null;

  // Mock Food Database (by Barcode or General Lookup)
  const FOOD_DB = {
    // Barcode mappings
    "0012000000133": { name: "Pepsi Can", emoji: "🥤", cal: 150, protein: 0, carbs: 41, fats: 0, serving: "1 can (355ml)", category: "Beverages" },
    "4008400401829": { name: "Ferrero Hazelnut Chocolate", emoji: "🍫", cal: 220, protein: 3, carbs: 24, fats: 13, serving: "4 pieces (37g)", category: "Sweets & Snacks" },
    "030000010204": { name: "Quaker Old Fashioned Oats", emoji: "🥣", cal: 150, protein: 5, carbs: 27, fats: 2.5, serving: "1/2 cup (40g)", category: "Cereals & Grains" },
    "021000612239": { name: "Kraft Cheddar Cheese", emoji: "🧀", cal: 110, protein: 7, carbs: 1, fats: 9, serving: "1 slice (28g)", category: "Dairy & Cheese" },
    // General food suggestions for uploads
    "general": [
      { name: "Avocado Salad", emoji: "🥗", cal: 320, protein: 6, carbs: 12, fats: 29, serving: "1 plate (250g)", category: "Salads" },
      { name: "Grilled Chicken Breast", emoji: "🍗", cal: 165, protein: 31, carbs: 0, fats: 3.6, serving: "1 piece (100g)", category: "Poultry" },
      { name: "Scrambled Eggs", emoji: "🍳", cal: 140, protein: 12, carbs: 1, fats: 10, serving: "2 large eggs", category: "Breakfast" },
      { name: "Fresh Banana", emoji: "🍌", cal: 105, protein: 1.3, carbs: 27, fats: 0.3, serving: "1 medium", category: "Fruits" },
      { name: "Fresh Apple", emoji: "🍎", cal: 95, protein: 0.5, carbs: 25, fats: 0.3, serving: "1 medium", category: "Fruits" }
    ]
  };

  // ==========================================
  // DOM ELEMENT REFERENCES
  // ==========================================
  const currentDateEl = document.getElementById('currentDate');
  const calRemainingVal = document.getElementById('calRemainingVal');
  const calLoggedVal = document.getElementById('calLoggedVal');
  const ringFill = document.getElementById('dashboardRingFill');

  const proteinLoggedEl = document.getElementById('proteinLogged');
  const carbsLoggedEl = document.getElementById('carbsLogged');
  const fatsLoggedEl = document.getElementById('fatsLogged');

  const proteinBar = document.getElementById('proteinBar');
  const carbsBar = document.getElementById('carbsBar');
  const fatsBar = document.getElementById('fatsBar');

  const diaryList = document.getElementById('diaryList');
  const diaryEmptyState = document.getElementById('diaryEmptyState');

  // Scanner View Elements
  const scannerTabBtn = document.getElementById('tabScanner');
  const uploadTabBtn = document.getElementById('tabUpload');
  const scannerView = document.getElementById('scannerView');
  const uploadView = document.getElementById('uploadView');

  const cameraStream = document.getElementById('cameraStream');
  const cameraFlash = document.getElementById('cameraFlash');
  const cameraErrorBanner = document.getElementById('cameraErrorBanner');
  const scannerLoader = document.getElementById('scannerLoader');

  const btnToggleCamera = document.getElementById('btnToggleCamera');
  const btnCaptureFrame = document.getElementById('btnCaptureFrame');
  const btnToggleStream = document.getElementById('btnToggleStream');
  const btnRetryCamera = document.getElementById('btnRetryCamera');

  // Upload View Elements
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const dropzonePrompt = document.getElementById('dropzonePrompt');
  const previewContainer = document.getElementById('previewContainer');
  const uploadImgPreview = document.getElementById('uploadImgPreview');
  const btnRemovePreview = document.getElementById('btnRemovePreview');
  const btnAnalyzeUpload = document.getElementById('btnAnalyzeUpload');
  const uploadLoader = document.getElementById('uploadLoader');

  // Results Drawer
  const resultsCard = document.getElementById('resultsCard');
  const btnCloseResults = document.getElementById('btnCloseResults');
  const btnAddFoodToLog = document.getElementById('btnAddFoodToLog');
  const servingCountInput = document.getElementById('servingCount');

  const resFoodEmoji = document.getElementById('resFoodEmoji');
  const resFoodName = document.getElementById('resFoodName');
  const resFoodCategory = document.getElementById('resFoodCategory');
  const resFoodCalories = document.getElementById('resFoodCalories');
  const resFoodProtein = document.getElementById('resFoodProtein');
  const resFoodCarbs = document.getElementById('resFoodCarbs');
  const resFoodFats = document.getElementById('resFoodFats');
  const resFoodServingSize = document.getElementById('resFoodServingSize');

  // Set Current Date Display
  const options = { weekday: 'long', month: 'short', day: 'numeric' };
  currentDateEl.textContent = new Date().toLocaleDateString('en-US', options);

  // ==========================================
  // INITIALIZATION & RENDER
  // ==========================================
  updateDashboard();
  renderDiaryList();
  startCamera(); // Start camera feed by default

  // ==========================================
  // TAB NAVIGATION
  // ==========================================
  scannerTabBtn.addEventListener('click', () => {
    switchTab('scanner');
  });

  uploadTabBtn.addEventListener('click', () => {
    switchTab('upload');
  });

  function switchTab(tab) {
    activeTab = tab;
    if (tab === 'scanner') {
      scannerTabBtn.classList.add('active');
      uploadTabBtn.classList.remove('active');
      scannerView.style.display = 'block';
      uploadView.style.display = 'none';
      startCamera();
    } else {
      scannerTabBtn.classList.remove('active');
      uploadTabBtn.classList.add('active');
      scannerView.style.display = 'none';
      uploadView.style.display = 'block';
      stopCamera();
    }
    // Close results if switching tabs
    closeResultsCard();
  }

  // ==========================================
  // WEBRTC CAMERA STREAMS
  // ==========================================
  async function startCamera() {
    stopCamera(); // Make sure previous stream is cleared

    const constraints = {
      video: {
        facingMode: activeFacingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    };

    try {
      currentStream = await navigator.mediaDevices.getUserMedia(constraints);
      cameraStream.srcObject = currentStream;
      cameraErrorBanner.style.display = 'none';
      cameraStream.style.display = 'block';
      btnToggleStream.textContent = '⏸️ Stop Camera';
      
      // Mirror front camera only
      if (activeFacingMode === 'user') {
        cameraStream.style.transform = 'scaleX(-1)';
      } else {
        cameraStream.style.transform = 'scaleX(1)';
      }
    } catch (err) {
      console.error('Camera access failed: ', err);
      cameraStream.style.display = 'none';
      cameraErrorBanner.style.display = 'flex';

      // Show specific error message based on the error type
      const errMsgEl = document.getElementById('cameraErrMsg');
      if (errMsgEl) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          errMsgEl.innerHTML = `
            <strong>Camera Permission Denied!</strong><br>
            👉 Click the <strong>🔒 Lock icon</strong> in the URL bar above → Set Camera to <strong>"Allow"</strong> → Then press <strong>Retry</strong>.`;
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          errMsgEl.innerHTML = `
            <strong>Camera Already In Use!</strong><br>
            👉 Close Zoom, Teams, or any other app using the camera → Then press <strong>Retry</strong>.`;
        } else if (err.name === 'NotFoundError') {
          errMsgEl.innerHTML = `<strong>No Camera Found!</strong><br>👉 Please connect a webcam to your PC.`;
        } else {
          errMsgEl.innerHTML = `<strong>Camera Error:</strong> ${err.name}. Please try again.`;
        }
      }
    }
  }

  function stopCamera() {
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
      currentStream = null;
    }
    cameraStream.srcObject = null;
    btnToggleStream.textContent = '▶️ Start Camera';
  }

  btnToggleStream.addEventListener('click', () => {
    if (currentStream) {
      stopCamera();
    } else {
      startCamera();
    }
  });

  btnToggleCamera.addEventListener('click', () => {
    activeFacingMode = (activeFacingMode === 'user') ? 'environment' : 'user';
    startCamera();
  });

  btnRetryCamera.addEventListener('click', startCamera);

  // Auto-start camera when Scanner tab is active
  startCamera();

  btnCaptureFrame.addEventListener('click', async () => {
    if (!currentStream) return;

    // Camera Shutter Flash animation
    cameraFlash.classList.add('flash-active');
    setTimeout(() => cameraFlash.classList.remove('flash-active'), 300);

    // Beep sound simulation
    playBeepSound();

    // Show Scanning Loader Overlay
    scannerLoader.style.display = 'flex';
    scannerLoader.querySelector('span').textContent = 'Analyzing image...';

    // Capture frame from video
    const canvas = document.createElement('canvas');
    canvas.width = cameraStream.videoWidth;
    canvas.height = cameraStream.videoHeight;
    const ctx = canvas.getContext('2d');
    
    // Handle mirroring if using front camera
    if (activeFacingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    
    ctx.drawImage(cameraStream, 0, 0, canvas.width, canvas.height);
    const base64Image = canvas.toDataURL('image/jpeg', 0.6);

    let scannedFood = await analyzeImageWithAI(base64Image);

    // Fallback if AI fails
    if (!scannedFood) {
      const choices = FOOD_DB.general;
      scannedFood = choices[Math.floor(Math.random() * choices.length)];
    }

    scannerLoader.style.display = 'none';
    showScanResults(scannedFood);
  });

  // Sound generator using Web Audio API
  function playBeepSound() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitch A5 beep
      gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime); // Soft volume
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.15); // Beep duration 150ms
    } catch (e) {
      console.log('Audio Context unsupported on user gesture limitation.');
    }
  }

  // ==========================================
  // DRAG & DROP FILE UPLOAD
  // ==========================================
  // Click dropzone to open files
  dropzone.addEventListener('click', (e) => {
    // Avoid double trigger if clicking cross button
    if (e.target !== btnRemovePreview && !btnRemovePreview.contains(e.target)) {
      fileInput.click();
    }
  });

  fileInput.addEventListener('change', handleFileSelect);

  // Drag over states
  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.add('drag-active');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag-active');
    }, false);
  });

  dropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
      fileInput.files = files;
      handleFileSelect();
    }
  });

  function handleFileSelect() {
    const file = fileInput.files[0];
    if (file && file.type.startsWith('image/')) {
      selectedFile = file;
      
      // Load file into preview image tag
      const reader = new FileReader();
      reader.onload = (e) => {
        uploadImgPreview.src = e.target.result;
        dropzonePrompt.style.display = 'none';
        previewContainer.style.display = 'block';
        btnAnalyzeUpload.disabled = false;
      };
      reader.readAsDataURL(file);
    }
  }

  btnRemovePreview.addEventListener('click', (e) => {
    e.stopPropagation();
    resetUploadZone();
  });

  function resetUploadZone() {
    selectedFile = null;
    fileInput.value = '';
    uploadImgPreview.src = '';
    previewContainer.style.display = 'none';
    dropzonePrompt.style.display = 'block';
    btnAnalyzeUpload.disabled = true;
    closeResultsCard();
  }

  btnAnalyzeUpload.addEventListener('click', async () => {
    if (!selectedFile) return;

    uploadLoader.style.display = 'flex';
    uploadLoader.querySelector('span').textContent = 'Analyzing nutritional values...';
    btnAnalyzeUpload.disabled = true;

    const base64Image = uploadImgPreview.src;

    let extractedFood = await analyzeImageWithAI(base64Image);

    if (!extractedFood) {
      const choices = FOOD_DB.general;
      extractedFood = choices[Math.floor(Math.random() * choices.length)];
    }

    uploadLoader.style.display = 'none';
    btnAnalyzeUpload.disabled = false;
    showScanResults(extractedFood);
  });

  // ==========================================
  // DEMO BARCODE CHIPS
  // ==========================================
  const demoChips = document.querySelectorAll('.demo-chip');
  demoChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const code = chip.getAttribute('data-barcode');
      
      // Show loader overlay briefly
      const loader = (activeTab === 'scanner') ? scannerLoader : uploadLoader;
      loader.querySelector('span').textContent = "Scanning barcode " + code + "...";
      loader.style.display = 'flex';

      setTimeout(() => {
        loader.style.display = 'none';
        
        const food = FOOD_DB[code];
        if (food) {
          playBeepSound();
          showScanResults(food);
        }
      }, 1200);
    });
  });

  // ==========================================
  // GEMINI API INTEGRATION
  // ==========================================
  async function analyzeImageWithAI(base64Image) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("No API key found. Falling back to mock.");
      return null;
    }

    try {
      // Extract base64 data without the data URL prefix
      const base64Data = base64Image.split(',')[1];
      const mimeType = base64Image.split(';')[0].split(':')[1] || 'image/jpeg';

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: "You are a nutrition expert. Given an image of food or a barcode, identify it and estimate its nutritional values per standard serving. Reply ONLY with a raw JSON object containing these keys: name (string), emoji (string), cal (number, calories), protein (number, grams), carbs (number, grams), fats (number, grams), serving (string, e.g. '1 plate' or '1 can'), category (string)."
              },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data
                }
              }
            ]
          }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      let content = data.candidates[0].content.parts[0].text;
      
      // Clean up markdown wrapping if Gemini returns it
      content = content.replace(/```json/gi, '').replace(/```/g, '').trim();
      
      return JSON.parse(content);
    } catch (err) {
      console.error("AI Analysis failed:", err);
      // Alert the user so they know it's not working, instead of silently failing
      alert("AI Scan failed or returned invalid data. Trying to use fallback.");
      return null;
    }
  }

  // ==========================================
  // LOGIC: DISPLAY SCAN RESULTS
  // ==========================================
  function showScanResults(food) {
    activeFoodResult = food;
    
    // Set UI elements
    resFoodEmoji.textContent = food.emoji || "🍎";
    resFoodName.textContent = food.name;
    resFoodCategory.textContent = food.category || "General";
    resFoodCalories.textContent = food.cal + " kcal";
    resFoodProtein.textContent = food.protein + "g";
    resFoodCarbs.textContent = food.carbs + "g";
    resFoodFats.textContent = food.fats + "g";
    resFoodServingSize.textContent = food.serving || "1 serving";
    
    // Reset serving multiplier inputs
    servingCountInput.value = "1.0";

    // Show Results Dialog
    resultsCard.style.display = 'flex';
    resultsCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // ZABARDAST FEATURE: AI Voice Output
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(`${food.name} detected. Approximately ${food.cal} calories.`);
      utterance.rate = 1.1; // Slightly faster
      window.speechSynthesis.cancel(); // Stop any currently speaking voice
      window.speechSynthesis.speak(utterance);
    }
  }

  function closeResultsCard() {
    resultsCard.style.display = 'none';
    activeFoodResult = null;
  }

  btnCloseResults.addEventListener('click', closeResultsCard);

  // Multiply values if serving count input changes
  servingCountInput.addEventListener('input', () => {
    if (!activeFoodResult) return;
    
    let multiplier = parseFloat(servingCountInput.value);
    if (isNaN(multiplier) || multiplier <= 0) multiplier = 1;

    resFoodCalories.textContent = Math.round(activeFoodResult.cal * multiplier) + " kcal";
    resFoodProtein.textContent = (activeFoodResult.protein * multiplier).toFixed(1) + "g";
    resFoodCarbs.textContent = (activeFoodResult.carbs * multiplier).toFixed(1) + "g";
    resFoodFats.textContent = (activeFoodResult.fats * multiplier).toFixed(1) + "g";
  });

  // ==========================================
  // ADD FOOD ENTRY TO LOG DIARY
  // ==========================================
  btnAddFoodToLog.addEventListener('click', () => {
    if (!activeFoodResult) return;

    let multiplier = parseFloat(servingCountInput.value);
    if (isNaN(multiplier) || multiplier <= 0) multiplier = 1;

    const newLogItem = {
      id: Date.now().toString(),
      name: activeFoodResult.name,
      emoji: activeFoodResult.emoji || "🍎",
      cal: Math.round(activeFoodResult.cal * multiplier),
      protein: Math.round(activeFoodResult.protein * multiplier),
      carbs: Math.round(activeFoodResult.carbs * multiplier),
      fats: Math.round(activeFoodResult.fats * multiplier),
      servings: multiplier,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };

    // Save to State & LocalStorage
    localDiary.push(newLogItem);
    localStorage.setItem('bite_diary', JSON.stringify(localDiary));

    // Update UI
    renderDiaryList();
    updateDashboard();

    // Trigger celebration particles
    triggerCelebration();

    // Close results dialog & reset preview
    closeResultsCard();
    if (activeTab === 'upload') {
      resetUploadZone();
    }
  });

  // Remove Entry from Diary
  window.deleteDiaryEntry = function(id) {
    localDiary = localDiary.filter(item => item.id !== id);
    localStorage.setItem('bite_diary', JSON.stringify(localDiary));
    renderDiaryList();
    updateDashboard();
  };

  // ==========================================
  // ZABARDAST FEATURES: CONFETTI EFFECTS
  // ==========================================
  function triggerCelebration() {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#10b981', '#3b82f6', '#f59e0b']
    });
  }

  // ==========================================
  // RENDERING UTILITY FUNCTIONS
  // ==========================================
  function renderDiaryList() {
    // Clear list
    diaryList.innerHTML = '';

    if (localDiary.length === 0) {
      diaryList.appendChild(diaryEmptyState);
      diaryEmptyState.style.display = 'block';
      return;
    }

    diaryEmptyState.style.display = 'none';

    // Reverse order to show newest first
    const reversedList = [...localDiary].reverse();

    reversedList.forEach(item => {
      const row = document.createElement('div');
      row.className = 'diary-row';
      row.innerHTML = `
        <div class="diary-info">
          <span class="diary-emoji">${item.emoji}</span>
          <div>
            <span class="diary-name">${item.name}</span>
            <span class="diary-details">${item.timestamp} • ${item.servings} serving(s)</span>
          </div>
        </div>
        <div class="diary-actions">
          <span class="diary-cal font-display">${item.cal} kcal</span>
          <button class="btn-delete-diary" onclick="deleteDiaryEntry('${item.id}')" title="Delete entry">×</button>
        </div>
      `;
      diaryList.appendChild(row);
    });
  }

  function updateDashboard() {
    // Sum total values
    let totalCal = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFats = 0;

    localDiary.forEach(item => {
      totalCal += item.cal;
      totalProtein += item.protein;
      totalCarbs += item.carbs;
      totalFats += item.fats;
    });

    const remainingCal = Math.max(0, GOALS.calories - totalCal);

    // Update Calorie texts
    animateValueText(calRemainingVal, parseInt(calRemainingVal.textContent.replace(/,/g, ''), 10) || 2100, remainingCal, 600);
    calLoggedVal.textContent = `${totalCal} kcal`;

    // Update SVG Circle Progress
    // Ring circumference is 2 * pi * r = 2 * 3.14 * 70 = 440
    const pct = Math.min(1.0, totalCal / GOALS.calories);
    const strokeOffset = 440 - (440 * pct);
    ringFill.style.strokeDashoffset = strokeOffset;

    // Update Macro Texts
    proteinLoggedEl.textContent = `${totalProtein}g`;
    carbsLoggedEl.textContent = `${totalCarbs}g`;
    fatsLoggedEl.textContent = `${totalFats}g`;

    // Update Macro Progress bars
    updateProgressBar(proteinBar, totalProtein, GOALS.protein);
    updateProgressBar(carbsBar, totalCarbs, GOALS.carbs);
    updateProgressBar(fatsBar, totalFats, GOALS.fats);
  }

  function updateProgressBar(element, val, goal) {
    const pct = Math.min(100, (val / goal) * 100);
    element.style.width = `${pct}%`;
  }

  function animateValueText(element, start, end, duration) {
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
  // AI DIET COACH CHATBOT LOGIC
  // ==========================================
  const aiChatFab = document.getElementById('aiChatFab');
  const aiChatPanel = document.getElementById('aiChatPanel');
  const closeChatBtn = document.getElementById('closeChatBtn');
  const sendChatBtn = document.getElementById('sendChatBtn');
  const chatInput = document.getElementById('chatInput');
  const chatMessages = document.getElementById('chatMessages');

  let chatHistory = []; // to maintain context for Gemini

  // Toggle Chat Drawer
  if (aiChatFab && aiChatPanel && closeChatBtn) {
    aiChatFab.addEventListener('click', () => {
      aiChatPanel.classList.add('active');
    });

    closeChatBtn.addEventListener('click', () => {
      aiChatPanel.classList.remove('active');
    });
  }

  function addChatMessage(sender, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `msg msg-${sender}`;
    msgDiv.innerHTML = `<div class="msg-bubble">${text}</div>`;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function addTypingIndicator() {
    const msgDiv = document.createElement('div');
    msgDiv.className = `msg msg-bot typing-indicator-container`;
    msgDiv.id = 'typingIndicator';
    msgDiv.innerHTML = `
      <div class="msg-bubble typing-indicator">
        <span></span><span></span><span></span>
      </div>
    `;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
      indicator.remove();
    }
  }

  async function handleSendChat() {
    const userMsg = chatInput.value.trim();
    if (!userMsg) return;

    // Show user message
    addChatMessage('user', userMsg);
    chatInput.value = '';
    
    // Add context if history is empty
    if (chatHistory.length === 0) {
      const remainingCal = Math.max(0, GOALS.calories - localDiary.reduce((s, i) => s + i.cal, 0));
      const todayFoods = localDiary.map(i => i.name).join(', ') || 'Nothing yet';
      const systemContext = `You are an AI Diet Coach. The user's daily goal is ${GOALS.calories} kcal. Today they have eaten: ${todayFoods}. They have ${remainingCal} kcal remaining. Be encouraging, concise, and helpful. Answer in simple text.`;
      
      chatHistory.push({
        role: 'user',
        parts: [{ text: systemContext }]
      });
      chatHistory.push({
        role: 'model',
        parts: [{ text: 'Understood. I will help guide them.' }]
      });
    }

    // Add actual user message to history
    chatHistory.push({
      role: 'user',
      parts: [{ text: userMsg }]
    });

    addTypingIndicator();

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: chatHistory
        })
      });

      if (!response.ok) throw new Error('API request failed');
      const data = await response.json();
      const botResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I'm having trouble thinking right now.";
      
      // Update history with bot response
      chatHistory.push({
        role: 'model',
        parts: [{ text: botResponse }]
      });

      removeTypingIndicator();
      addChatMessage('bot', botResponse.replace(/\*/g, '')); // remove markdown asterisks for simplicity

    } catch (error) {
      console.error('Chat error:', error);
      removeTypingIndicator();
      addChatMessage('bot', 'Network error. Please check your API key or connection.');
    }
  }

  if (sendChatBtn && chatInput) {
    sendChatBtn.addEventListener('click', handleSendChat);
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSendChat();
    });
  }

});
