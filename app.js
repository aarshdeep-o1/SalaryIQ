// Global Chart references to avoid collision
let skillsChartInstance = null;
let radarChartInstance = null;
let growthChartInstance = null;

// Track active theme state
let currentTheme = 'dark'; // 'dark' or 'light'

// Update the CGPA value indicator bubble on slider drag
function updateCGPABubble(val) {
    document.getElementById('cgpaValue').textContent = parseFloat(val).toFixed(1);
}

// ==========================================
// Resume Upload Handlers
// ==========================================
function handleResumeUpload(input) {
    const file = input.files[0];
    const badge = document.getElementById('fileConfirmBadge');
    const badgeText = document.getElementById('fileConfirmText');
    const uploadBtnText = document.getElementById('uploadBtnText');
    
    if (file) {
        badge.style.display = 'inline-flex';
        badgeText.textContent = `Resume received ✓ (${file.name})`;
        uploadBtnText.textContent = 'Change Resume';
    } else {
        badge.style.display = 'none';
        uploadBtnText.textContent = 'Choose Resume File';
    }
}

// ==========================================
// Section 1: Calculate Placements Action
// ==========================================
function calculateSalary() {
    // Show UI Dashboard Panels
    const welcome = document.getElementById('welcomeCard');
    const results = document.getElementById('resultsDashboard');
    const overlay = document.getElementById('loadingOverlay');

    welcome.style.display = 'none';
    results.style.display = 'flex';
    overlay.style.display = 'flex';

    const btn = document.querySelector('.btn-predict');
    btn.disabled = true;

    // Simulate luxury SaaS latency calculation
    setTimeout(() => {
        overlay.style.display = 'none';
        btn.disabled = false;
        
        executePredictionV2();
        
        document.getElementById('resultsDashboard').scrollIntoView({ behavior: 'smooth' });
    }, 1200);
}

// Main Forecasting Formula Logic
function executePredictionV2() {
    // 1. Gather Input Data
    const name = document.getElementById('gradName').value.trim() || 'Premium Graduate';
    
    const tierRadios = document.getElementsByName('collegeTier');
    let tier = 'IIT';
    for (const r of tierRadios) {
        if (r.checked) { tier = r.value; break; }
    }

    const cgpa = parseFloat(document.getElementById('cgpaSlider').value);
    const city = document.getElementById('locationSelect').value;
    const projects = parseInt(document.getElementById('projectsSlider').value);
    const internships = parseInt(document.getElementById('internshipsSlider').value);
    const certs = parseInt(document.getElementById('certsSlider').value);

    const skillsCheckboxes = document.getElementsByName('skills');
    const selectedSkills = [];
    skillsCheckboxes.forEach(cb => {
        if (cb.checked) selectedSkills.push(cb.value);
    });

    // 2. Algorithm Math: Baseline Package (LPA)
    let baseSalary = 3.5; // Private baseline
    if (tier === 'IIT') baseSalary = 9.5;
    else if (tier === 'NIT') baseSalary = 7.0;
    else if (tier === 'State') baseSalary = 4.8;

    // CGPA Multiplier (0.0 to 10.0 scale)
    const cgpaMultiplier = 0.6 + (cgpa / 10.0) * 0.75; // 0.6x to 1.35x

    // City Premium Addition (LPA)
    let cityPremium = 0.3;
    if (city === 'Bangalore') cityPremium = 2.2;
    else if (city === 'Hyderabad') cityPremium = 1.8;
    else if (city === 'Mumbai') cityPremium = 1.5;
    else if (city === 'Pune') cityPremium = 1.1;
    else if (city === 'Chennai') cityPremium = 0.8;

    // Skills additions
    let skillsPremium = 0.0;
    selectedSkills.forEach(s => {
        if (s === 'ML') skillsPremium += 2.5;
        else if (s === 'Python') skillsPremium += 1.8;
        else if (s === 'React') skillsPremium += 1.6;
        else if (s === 'Java') skillsPremium += 1.5;
        else if (s === 'SQL') skillsPremium += 1.2;
        else if (s === 'Tableau') skillsPremium += 0.9;
        else if (s === 'PowerBI') skillsPremium += 0.8;
        else if (s === 'Excel') skillsPremium += 0.4;
    });

    // Experience modifiers
    const projectsPremium = projects * 0.35; // Max +3.5 LPA
    const internshipsPremium = internships * 1.2; // Max +6.0 LPA
    const certsPremium = certs * 0.15; // Max +1.5 LPA

    // Overall estimated CTC
    const predictedBase = (baseSalary * cgpaMultiplier) + cityPremium + skillsPremium + projectsPremium + internshipsPremium + certsPremium;
    
    // Limits
    const lowBound = Math.max(3.0, predictedBase * 0.88);
    const highBound = predictedBase * 1.12;

    // KPI 2: Hireability Score out of 100
    const cgpaScoreVal = (cgpa / 10.0) * 35; // max 35
    const skillsScoreVal = (selectedSkills.length / 8.0) * 20; // max 20
    const projectsScoreVal = (projects / 10.0) * 15; // max 15
    const internshipsScoreVal = (internships / 5.0) * 20; // max 20
    const certsScoreVal = (certs / 10.0) * 10; // max 10
    
    let hireability = Math.round(cgpaScoreVal + skillsScoreVal + projectsScoreVal + internshipsScoreVal + certsScoreVal);
    // Add Tier weight premium to score
    if (tier === 'IIT') hireability += 5;
    else if (tier === 'NIT') hireability += 3;
    hireability = Math.max(15, Math.min(100, hireability));

    // KPI 3: Market Rank percentile
    let percentile = Math.round(50 + (hireability - 50) * 0.88);
    if (tier === 'IIT' && cgpa > 9.0) percentile = Math.max(percentile, 98);
    percentile = Math.max(10, Math.min(99, percentile));

    // KPI 4: Profile Strength Badge
    let strength = 'Weak';
    let strengthClass = 'weak';
    if (hireability >= 85) { strength = 'Elite'; strengthClass = 'elite'; }
    else if (hireability >= 68) { strength = 'Strong'; strengthClass = 'strong'; }
    else if (hireability >= 45) { strength = 'Average'; strengthClass = 'avg'; }

    // 3. UI Update: Stats KPI Card Values (Animated)
    animateKPIValues(predictedBase, lowBound, highBound, hireability, percentile, strength, strengthClass);

    // 4. Render All Three Charts Custom Configured
    renderAllCharts(selectedSkills, cgpa, projects, internships, certs, predictedBase, strength);

    // 5. Skill Gap percentage analysis recommendations
    updateSkillGapSectionV2(selectedSkills);

    // 6. Salary Negotiation script generator
    updateNegotiationCard(lowBound, highBound, selectedSkills, internships, projects);
}

// KPI counters and badge classes
function animateKPIValues(base, low, high, hireScore, rank, strength, strengthClass) {
    // 1. Predicted CTC range
    document.getElementById('lblPredictedSalary').textContent = `₹${low.toFixed(1)} - ${high.toFixed(1)}L`;

    // 2. Animate Hire-ability Score
    const hireLabel = document.getElementById('lblHireability');
    let curScore = 0;
    const scoreTimer = setInterval(() => {
        curScore += 2;
        if (curScore >= hireScore) {
            clearInterval(scoreTimer);
            hireLabel.textContent = `${hireScore}%`;
        } else {
            hireLabel.textContent = `${curScore}%`;
        }
    }, 15);

    // 3. Animate Rank Percentile
    const rankLabel = document.getElementById('lblMarketRank');
    let curPercent = 0;
    const rankTimer = setInterval(() => {
        curPercent += 2;
        if (curPercent >= rank) {
            clearInterval(rankTimer);
            rankLabel.textContent = `Top ${100 - rank}%`;
            rankLabel.className = 'kpi-value gold-txt';
        } else {
            rankLabel.textContent = `Top ${100 - curPercent}%`;
        }
    }, 15);

    // 4. Badge String Update
    const badge = document.getElementById('lblProfileStrength');
    badge.className = `strength-badge ${strengthClass}`;
    badge.textContent = strength;
}

// Render three visual Chart.js dashboards (Theme Aware)
function renderAllCharts(userSkills, cgpa, projects, internships, certs, salaryVal, strength) {
    const ctxBar = document.getElementById('skillsChart').getContext('2d');
    const ctxRadar = document.getElementById('radarChart').getContext('2d');
    const ctxLine = document.getElementById('growthChart').getContext('2d');

    // Destroy to avoid grid overlap
    if (skillsChartInstance) skillsChartInstance.destroy();
    if (radarChartInstance) radarChartInstance.destroy();
    if (growthChartInstance) growthChartInstance.destroy();

    // Adjust colors based on current theme state
    const isLight = (currentTheme === 'light');
    const gridColor = isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.04)';
    const tickColor = isLight ? '#475569' : '#94a3b8';
    const labelColor = isLight ? '#0f172a' : '#f8fafc';

    // 1. Horizontal Bar Chart (S3)
    const skillList = [
        { key: 'ML', name: 'ML Core Systems', value: 2.5 },
        { key: 'Python', name: 'Python Engineering', value: 1.8 },
        { key: 'React', name: 'React Development', value: 1.6 },
        { key: 'Java', name: 'Java Enterprise Systems', value: 1.5 },
        { key: 'SQL', name: 'SQL Database Design', value: 1.2 },
        { key: 'Tableau', name: 'Tableau Visuals', value: 0.9 },
        { key: 'PowerBI', name: 'Power BI Reporting', value: 0.8 },
        { key: 'Excel', name: 'Advanced MS Excel', value: 0.4 }
    ];

    const barLabels = skillList.map(s => s.name);
    const barData = skillList.map(s => s.value);
    
    // Highlight colors
    const activeColor = isLight ? 'rgba(181, 143, 34, 0.85)' : 'rgba(212, 175, 55, 0.85)';
    const activeBorder = isLight ? '#b58f22' : '#d4af37';
    const inactiveColor = isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.03)';
    const inactiveBorder = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.1)';

    const bgColors = skillList.map(s => userSkills.includes(s.key) ? activeColor : inactiveColor);
    const borderColors = skillList.map(s => userSkills.includes(s.key) ? activeBorder : inactiveBorder);

    skillsChartInstance = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: barLabels,
            datasets: [{
                data: barData,
                backgroundColor: bgColors,
                borderColor: borderColors,
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { color: gridColor }, ticks: { color: tickColor } },
                y: { grid: { display: false }, ticks: { color: labelColor } }
            }
        }
    });

    // 2. Radar Chart Profile benchmarking vs elite graduates (S3)
    const normCGPA = (cgpa / 10.0) * 100;
    const normProj = (projects / 10.0) * 100;
    const normInt = (internships / 5.0) * 100;
    const normCert = (certs / 10.0) * 100;
    const normSkills = (userSkills.length / 8.0) * 100;

    const radarFill = isLight ? 'rgba(181, 143, 34, 0.15)' : 'rgba(212, 175, 55, 0.2)';
    const radarStroke = isLight ? '#b58f22' : '#d4af37';
    const radarBenchStroke = isLight ? '#64748b' : '#475569';
    const radarBenchFill = isLight ? 'rgba(100, 116, 139, 0.1)' : 'rgba(30, 41, 59, 0.3)';

    radarChartInstance = new Chart(ctxRadar, {
        type: 'radar',
        data: {
            labels: ['CGPA Score', 'Projects Count', 'Internships', 'Certifications', 'Skills Range'],
            datasets: [
                {
                    label: 'Your Profile',
                    data: [normCGPA, normProj, normInt, normCert, normSkills],
                    backgroundColor: radarFill,
                    borderColor: radarStroke,
                    borderWidth: 2,
                    pointBackgroundColor: radarStroke
                },
                {
                    label: 'Top Hired Freshers',
                    data: [93, 80, 60, 50, 85],
                    backgroundColor: radarBenchFill,
                    borderColor: radarBenchStroke,
                    borderWidth: 1.5,
                    pointBackgroundColor: radarBenchStroke
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: tickColor, font: { family: 'Inter', size: 10 } } } },
            scales: {
                r: {
                    angleLines: { color: gridColor },
                    grid: { color: gridColor },
                    pointLabels: { color: labelColor, font: { family: 'Outfit', size: 10, weight: '700' } },
                    ticks: { display: false }
                }
            }
        }
    });

    // 3. Line Chart Projection of salary growth 1yr 3yr 5yr timeline (S3)
    let trajectoryMult = [1.0, 1.15, 1.48, 2.05]; // Baseline
    if (strength === 'Elite') trajectoryMult = [1.0, 1.28, 1.75, 2.65];
    else if (strength === 'Strong') trajectoryMult = [1.0, 1.20, 1.55, 2.20];
    else if (strength === 'Weak') trajectoryMult = [1.0, 1.08, 1.25, 1.60];

    const growthTimelineData = trajectoryMult.map(mult => salaryVal * mult);

    growthChartInstance = new Chart(ctxLine, {
        type: 'line',
        data: {
            labels: ['Campus Placement', '1-Year Experience', '3-Years Experience', '5-Years Experience'],
            datasets: [{
                label: 'Salary Lift (LPA)',
                data: growthTimelineData,
                borderColor: radarStroke,
                borderWidth: 2.5,
                backgroundColor: radarFill,
                fill: true,
                tension: 0.3,
                pointBackgroundColor: radarStroke,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { color: gridColor }, ticks: { color: tickColor, font: { family: 'Outfit', weight: '700' } } },
                y: { grid: { color: gridColor }, ticks: { color: tickColor, callback: function(val) { return '₹' + val.toFixed(1) + 'L'; } } }
            }
        }
    });
}

// Section 4 — Upgraded Skill Gap Analyzer
function updateSkillGapSectionV2(userSkills) {
    const list = document.getElementById('gapSkillList');
    list.innerHTML = ''; // reset

    const skillsBank = [
        { key: 'ML', name: 'Machine Learning Core', boost: 25, val: 2.5, desc: 'Master Scikit-Learn models, neural networks, and feature sets.' },
        { key: 'React', name: 'React Development JS', boost: 18, val: 1.6, desc: 'Learn component lifecycle states, hooks, and REST APIs.' },
        { key: 'Java', name: 'Java Backend Systems', boost: 16, val: 1.5, desc: 'Practice Spring Boot architectures and SQL schema bindings.' },
        { key: 'SQL', name: 'SQL & Database Optimization', boost: 14, val: 1.2, desc: 'Acquire indexing concepts, joins, and database partitions.' },
        { key: 'Python', name: 'Python Application Dev', boost: 15, val: 1.8, desc: 'Build backend libraries, FastAPI, and data scripts.' },
        { key: 'Tableau', name: 'Tableau Business Graphics', boost: 10, val: 0.9, desc: 'Master analytics dashboards, storyboard files, and DAX equivalents.' },
        { key: 'PowerBI', name: 'Power BI Analytics', boost: 8, val: 0.8, desc: 'Create operational graphs, visual reporting, and data pipelines.' },
        { key: 'Excel', name: 'Advanced MS Excel Macros', boost: 5, val: 0.4, desc: 'Learn pivot charts, lookup functions, and data cleanup.' }
    ];

    const missingSkills = skillsBank.filter(s => !userSkills.includes(s.key));

    if (missingSkills.length === 0) {
        list.innerHTML = `
            <div class="gap-insight-celebrate">
                <i class="fa-solid fa-crown"></i>
                <h4>Complete Portfolio Mastered!</h4>
                <p>You have unlocked every major technical core asset in our analyzer database. Recruiter profiles place you in the highest brackets of placements efficiency.</p>
            </div>
        `;
    } else {
        // Sort missing skills by highest boost potential
        missingSkills.sort((a, b) => b.val - a.val);

        // Pick top 3 missing skills
        const targetRecs = missingSkills.slice(0, 3);

        targetRecs.forEach(skill => {
            const row = document.createElement('div');
            row.className = 'gap-skill-row';
            row.innerHTML = `
                <div class="gap-skill-info">
                    <div class="gap-skill-icon"><i class="fa-solid fa-circle-nodes"></i></div>
                    <div class="gap-skill-details">
                        <h4>Learn ${skill.name}</h4>
                        <p>${skill.desc}</p>
                    </div>
                </div>
                <div class="gap-skill-percentage">+${skill.boost}% Hike</div>
            `;
            list.appendChild(row);
        });
    }
}

// Section 6 — Salary Negotiation scripts updates
function updateNegotiationCard(low, high, skills, internships, projects) {
    const quote = Math.round(high * 1.15);
    const walkaway = Math.round(high * 0.95);
    const floor = Math.round(low * 0.98);

    document.getElementById('negQuote').textContent = `₹${quote.toFixed(1)}L`;
    document.getElementById('negWalkaway').textContent = `₹${walkaway.toFixed(1)}L`;
    document.getElementById('negFloor').textContent = `₹${floor.toFixed(1)}L`;

    // Construct highly personalized speech text
    let scriptText = '';
    const skillsText = skills.length > 0 ? skills.slice(0, 3).join(', ') : 'core software fundamentals';
    
    if (internships > 0) {
        scriptText = `"Based on my solid training across <strong>${skillsText}</strong>, coupled with practical engineering experience during my <strong>${internships} internship(s)</strong> and <strong>${projects} academic projects</strong>, I am seeking an initial annual compensation between <strong>₹${high.toFixed(1)} LPA</strong> and <strong>₹${quote.toFixed(1)} LPA</strong>. I am confident my hands-on skills match this market valuation."`;
    } else {
        scriptText = `"Given my dedicated focus in developing core competencies across <strong>${skillsText}</strong> and demonstrating robust execution in my <strong>${projects} technical projects</strong>, I am seeking a commencing package in the range of <strong>₹${low.toFixed(1)} LPA</strong> to <strong>₹${high.toFixed(1)} LPA</strong>. This package aligns with current industry benchmarks."`;
    }

    document.getElementById('negScriptText').innerHTML = scriptText;
}

// Clipboard copier
function copyNegotiationScript() {
    const scriptEl = document.getElementById('negScriptText');
    const text = scriptEl.innerText;
    
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('btnCopyLabel');
        btn.textContent = 'Copied to Clipboard!';
        setTimeout(() => {
            btn.textContent = 'Copy Speech Script';
        }, 2000);
    });
}

// ==========================================
// Sun/Moon Theme Switcher Module
// ==========================================
function toggleTheme() {
    const body = document.body;
    const themeIcon = document.getElementById('themeIcon');
    
    if (body.classList.contains('light-theme')) {
        body.classList.remove('light-theme');
        themeIcon.className = 'fa-solid fa-moon';
        currentTheme = 'dark';
    } else {
        body.classList.add('light-theme');
        themeIcon.className = 'fa-solid fa-sun';
        currentTheme = 'light';
    }

    // Force active chart redrawing with new variables immediately if calculations have been run
    const resultsDashboard = document.getElementById('resultsDashboard');
    if (resultsDashboard.style.display === 'flex') {
        const selectedTier = document.querySelector('input[name="collegeTier"]:checked').value;
        const cgpa = parseFloat(document.getElementById('cgpaSlider').value);
        const projects = parseInt(document.getElementById('projectsSlider').value);
        const internships = parseInt(document.getElementById('internshipsSlider').value);
        const certs = parseInt(document.getElementById('certsSlider').value);

        const skillsCheckboxes = document.getElementsByName('skills');
        const selectedSkills = [];
        skillsCheckboxes.forEach(cb => {
            if (cb.checked) selectedSkills.push(cb.value);
        });

        // Compute base again quickly to redraw charts
        let baseSalary = 3.5;
        if (selectedTier === 'IIT') baseSalary = 9.5;
        else if (selectedTier === 'NIT') baseSalary = 7.0;
        else if (selectedTier === 'State') baseSalary = 4.8;
        const cgpaMultiplier = 0.6 + (cgpa / 10.0) * 0.75;
        
        let cityPremium = 0.3;
        const city = document.getElementById('locationSelect').value;
        if (city === 'Bangalore') cityPremium = 2.2;
        else if (city === 'Hyderabad') cityPremium = 1.8;
        else if (city === 'Mumbai') cityPremium = 1.5;
        else if (city === 'Pune') cityPremium = 1.1;
        else if (city === 'Chennai') cityPremium = 0.8;

        let skillsPremium = 0.0;
        selectedSkills.forEach(s => {
            if (s === 'ML') skillsPremium += 2.5;
            else if (s === 'Python') skillsPremium += 1.8;
            else if (s === 'React') skillsPremium += 1.6;
            else if (s === 'Java') skillsPremium += 1.5;
            else if (s === 'SQL') skillsPremium += 1.2;
            else if (s === 'Tableau') skillsPremium += 0.9;
            else if (s === 'PowerBI') skillsPremium += 0.8;
            else if (s === 'Excel') skillsPremium += 0.4;
        });

        const predictedBase = (baseSalary * cgpaMultiplier) + cityPremium + skillsPremium + (projects * 0.35) + (internships * 1.2) + (certs * 0.15);
        let strength = 'Weak';
        let hireability = Math.round(((cgpa / 10.0) * 35) + ((selectedSkills.length / 8.0) * 20) + ((projects / 10.0) * 15) + ((internships / 5.0) * 20) + ((certs / 10.0) * 10));
        if (selectedTier === 'IIT') hireability += 5;
        else if (selectedTier === 'NIT') hireability += 3;
        
        if (hireability >= 85) strength = 'Elite';
        else if (hireability >= 68) strength = 'Strong';
        else if (hireability >= 45) strength = 'Average';

        renderAllCharts(selectedSkills, cgpa, projects, internships, certs, predictedBase, strength);
    }
}

// ==========================================
// Chatbot Voice Input Recognition API
// ==========================================
let chatSpeechRecognition = null;
let isChatVoiceListening = false;

function toggleChatVoice() {
    const btn = document.getElementById('chatMicBtn');
    const input = document.getElementById('chatInputBox');

    // Web Speech API checks
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        alert("Web Speech API is not supported in this browser. Please use Chrome or Edge.");
        return;
    }

    if (isChatVoiceListening) {
        // Stop listening
        chatSpeechRecognition.stop();
        resetChatVoiceUI();
    } else {
        // Start listening
        chatSpeechRecognition = new SpeechRecognition();
        chatSpeechRecognition.continuous = false;
        chatSpeechRecognition.lang = 'en-IN'; // Indian-English target accent
        chatSpeechRecognition.interimResults = false;
        chatSpeechRecognition.maxAlternatives = 1;

        chatSpeechRecognition.onstart = function() {
            isChatVoiceListening = true;
            btn.classList.add('listening');
            input.placeholder = 'Listening... Speak your career question...';
        };

        chatSpeechRecognition.onerror = function(event) {
            console.error("Chat Speech recognition error", event.error);
            resetChatVoiceUI();
            alert(`Voice recognition error: ${event.error}`);
        };

        chatSpeechRecognition.onend = function() {
            resetChatVoiceUI();
        };

        chatSpeechRecognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            console.log("Chat Speech Result:", transcript);
            
            // Auto-fill chat input box directly
            input.value = transcript;
        };

        chatSpeechRecognition.start();
    }
}

function resetChatVoiceUI() {
    isChatVoiceListening = false;
    const btn = document.getElementById('chatMicBtn');
    const input = document.getElementById('chatInputBox');
    
    if (btn) btn.classList.remove('listening');
    if (input) input.placeholder = 'Ask about placements, off-campus, CGPA ratios...';
}

// ==========================================
// Section 5: AI-Powered LinkedIn Career Chatbot Module
// ==========================================
async function fetchClaudeAI(query) {
    const chatContainer = document.getElementById('chatMessages');
    
    // Add pulsing typing indicator bubble
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'chat-msg typing';
    typingIndicator.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;
    chatContainer.appendChild(typingIndicator);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "anthropic-version": "2023-06-01"
                // API Key is automatically handled by the server proxy context
            },
            body: JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: 1024,
                system: "You are Rajeev Sharma, an expert Indian placement and career coach. You only answer questions related to: salary negotiation, fresher jobs in India, LinkedIn profile tips, resume building, skill recommendations, CGPA importance, off-campus placements, interview preparation, and career growth for Indian freshers. If asked anything outside career topics, politely redirect back to career advice. Always give India-specific, practical, confident answers in a friendly tone.",
                messages: [
                    { role: "user", content: query }
                ]
            })
        });

        // Remove typing indicator
        if (typingIndicator.parentNode === chatContainer) {
            chatContainer.removeChild(typingIndicator);
        }

        if (!response.ok) {
            throw new Error(`HTTP Error Status: ${response.status}`);
        }

        const data = await response.json();
        const replyText = data.content[0].text;
        appendChatMessage(replyText, 'bot');

    } catch (error) {
        console.error("Claude API Error, falling back to local prebaked rules:", error);
        
        // Remove typing indicator if still present
        if (typingIndicator.parentNode === chatContainer) {
            chatContainer.removeChild(typingIndicator);
        }

        // Graceful smart local backup response
        const fallbackText = getSmartOfflineFallback(query);
        appendChatMessage(fallbackText, 'bot');
    }
}

// Local Pre-baked Answers List in case of network outages / proxy errors
const offlineAnswers = [
    "<strong>Salary Negotiation:</strong> Point directly to your live URLs of your projects, certifications, or internships! Frame it positively: <em>'I spent 6 months building functional React APIs during my internship which significantly cuts down my developer onboarding time, adding immediate value.'</em>",
    "<strong>Placement CGPA Metrics:</strong> Standard campus placement filters use <strong>6.5 CGPA</strong> as the absolute baseline. If your CGPA is <strong>8.0+</strong>, you are in the top bracket and will clear 98% of tech company eligibility filters. If below 6.0, focus on off-campus channels where portfolios bypass scores.",
    "<strong>First Skill Recommendation:</strong> For high-leverage entry points, master <strong>Python or React</strong>. Data and analytics rely heavily on Python, while React powers frontend engineering. Couple either of these with <strong>SQL core query structures</strong> to build full-stack credibility.",
    "<strong>LinkedIn Headline:</strong> Don't just write 'Student at XYZ College'. Use this high-impact Indian HR format: <em>'[Target Role] | Specialized in [React/ML/SQL] | [Internship or Project Milestone]'</em>. Example: <strong>'Frontend Developer | React & Javascript Specialist | Completed 2 Product Internships | 9.0 CGPA'</strong>",
    "<strong>Am I Underpaid?:</strong> Standard service-based companies pay <strong>₹3.5 - ₹4.5 LPA</strong>. Product-based mid-tier organizations range between <strong>₹6.5 - ₹10.0 LPA</strong>. If you have core proficiencies in Python/ML/React with projects, and are getting offers below <strong>₹4.0 LPA</strong>, you are technically underpaid compared to modern skill valuations.",
    "<strong>Off-Campus Placements:</strong> Skip traditional career boards. Apply directly via: (1) LinkedIn cold-emailing tech leads (ask for code reviews, not jobs), (2) Curating developer portfolios on Github, and (3) Tracking recruitment drives on platforms like Instahyre, Wellfound, or Naukri.",
    "<strong>IIT vs Non-IIT Salary Gap:</strong> Elite colleges (IITs, NITs) have institutional brand relationships, unlocking base campus offers of <strong>₹9.0 - ₹12.0 LPA</strong>. However, in off-campus recruiting, after 1 year of industrial experience, the college brand is minimized, and your technical code skills drive identical compensations.",
    "<strong>Internship Valuation:</strong> Absolutely! In Indian IT recruitment, 1 quality internship of 3-6 months is valued higher than a perfect 10.0 CGPA. It proves you understand git branching, Agile standups, and codebase reviews. Ensure it is highlighted at the top of your resume.",
    "<strong>Tech City Salary Premiums:</strong> <strong>Bangalore</strong> remains the highest premium location (+2.2 LPA), followed closely by <strong>Hyderabad</strong> (+1.8 LPA) and <strong>Mumbai/Delhi NCR</strong> (+1.5 LPA). Pune and Chennai offer moderate packages, while Tier-2 cities offer standard baselines with lower living costs.",
    "<strong>Online Certifications Value:</strong> Online certs (Coursera, Udemy) show high curiosity, but hold little direct weight on resumes without a GitHub link. Professional cloud certs (AWS practitioner, Azure core, Oracle Java) are highly respected as they are audited directly by tech giants.",
    "<strong>Resume Project standards:</strong> Aim for <strong>2 or 3 highly finished projects</strong> rather than 10 generic ones. One project must be deployed live (e.g., hosted on Vercel/Netlify) with a real database back-end. HR screening checks if URLs are active.",
    "<strong>ATS Resume format:</strong> Use a clean, single-page, single-column ATS-friendly layout. Structure sections: (1) Profile Summary, (2) Core Skills (bullet tags), (3) Internships, (4) Practical Projects (with active git links), and (5) Academic Education.",
    "<strong>React vs Angular:</strong> <strong>React JS</strong> is currently more dominant in Indian start-ups and mid-market web agencies. Angular is widely used in legacy banking enterprise code. React offers a shorter learning curve and higher entry salaries.",
    "<strong>Tableau vs Power BI:</strong> <strong>Power BI</strong> is highly integrated into corporate Microsoft setups and standard databases. <strong>Tableau</strong> is favored by dedicated analytics consultation hubs. Power BI is easier to learn and has higher market volumes.",
    "<strong>Breaking into ML:</strong> Don't just apply for 'ML Engineer' right away. Transition from a Data Analyst role or Python developer first. Build hands-on projects showing you can clean dirty datasets, train local models, and host them as APIs using FastAPI."
];

// Offline keyword router
function getSmartOfflineFallback(query) {
    const lower = query.toLowerCase();
    
    if (lower.includes('negotiat') || lower.includes('salary') || lower.includes('lpa') || lower.includes('pay') || lower.includes('money')) {
        return offlineAnswers[0];
    }
    if (lower.includes('cgpa') || lower.includes('marks') || lower.includes('gpa') || lower.includes('score')) {
        return offlineAnswers[1];
    }
    if (lower.includes('skill') || lower.includes('learn') || lower.includes('study') || lower.includes('course')) {
        return offlineAnswers[2];
    }
    if (lower.includes('headline') || lower.includes('linkedin') || lower.includes('profile')) {
        return offlineAnswers[3];
    }
    if (lower.includes('underpaid') || lower.includes('market average')) {
        return offlineAnswers[4];
    }
    if (lower.includes('offcampus') || lower.includes('off-campus') || lower.includes('job') || lower.includes('apply')) {
        return offlineAnswers[5];
    }
    if (lower.includes('iit') || lower.includes('tier') || lower.includes('college')) {
        return offlineAnswers[6];
    }
    if (lower.includes('intern') || lower.includes('experience')) {
        return offlineAnswers[7];
    }
    if (lower.includes('city') || lower.includes('bangalore') || lower.includes('hyderabad') || lower.includes('pune') || lower.includes('place')) {
        return offlineAnswers[8];
    }
    if (lower.includes('certif') || lower.includes('online')) {
        return offlineAnswers[9];
    }
    if (lower.includes('project')) {
        return offlineAnswers[10];
    }
    if (lower.includes('resume') || lower.includes('cv')) {
        return offlineAnswers[11];
    }
    if (lower.includes('react') || lower.includes('angular') || lower.includes('frontend')) {
        return offlineAnswers[12];
    }
    if (lower.includes('tableau') || lower.includes('power bi') || lower.includes('powerbi')) {
        return offlineAnswers[13];
    }
    if (lower.includes('ml') || lower.includes('machine learning') || lower.includes('ai')) {
        return offlineAnswers[14];
    }

    const name = document.getElementById('gradName').value.trim() || 'Premium Graduate';
    const cgpa = parseFloat(document.getElementById('cgpaSlider').value);
    const internships = parseInt(document.getElementById('internshipsSlider').value);
    
    return `Excellent query, <strong>${name}</strong>. While my cloud AI channels are currently initializing, reviewing your specific placement parameters with a **${cgpa.toFixed(1)} CGPA** and **${internships} internship(s)**, my core advice is to continue coding hands-on portfolio projects and documenting your engineering milestones on LinkedIn. Recruiters search for builders!`;
}

// Send prebaked question
function sendPrebakedQuestion(idx) {
    const questions = [
        "How do I negotiate salary?",
        "Is my CGPA good enough?",
        "Which skill should I learn first?",
        "How to write LinkedIn headline?",
        "Am I underpaid?",
        "How to apply off-campus in India?",
        "IIT vs non-IIT salary gap?",
        "Do internships count as experience?",
        "Which Indian city pays the highest?",
        "Are online certifications worth it?",
        "How many projects are ideal?",
        "What is a good fresher resume format?",
        "Is React or Angular better?",
        "Should I learn Tableau or Power BI?",
        "How to break into ML as a fresher?"
    ];

    const query = questions[idx];
    appendChatMessage(query, 'user');
    fetchClaudeAI(query);
}

// Handle custom keyboard chat submission
function handleCustomChatMessage() {
    const input = document.getElementById('chatInputBox');
    const query = input.value.trim();
    if (!query) return;

    appendChatMessage(query, 'user');
    input.value = '';

    fetchClaudeAI(query);
}

// Helper to push chat messages into dialog container
function appendChatMessage(text, sender) {
    const chatContainer = document.getElementById('chatMessages');
    const msg = document.createElement('div');
    msg.className = `chat-msg ${sender}`;
    msg.innerHTML = text;
    
    chatContainer.appendChild(msg);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}
