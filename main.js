// --- CONFIGURATION ---
const DISCORD_USER_ID = '748262928955998360'; 
const API_URL = `https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}`;

// --- SVG HEART TRAIL ---
document.addEventListener('mousemove', function(e) {
    const heart = document.createElement('div');
    // Using a simplified version of your SVG for performance
    heart.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 511.999 511.999">
            <path fill="#FF728B" d="M196.786,357.748C83.906,553.262-87.718,256,138.042,256c-225.761,0-54.136-297.262,58.744-101.747 c-112.881-195.515,230.368-195.515,117.487,0C427.154-41.262,598.779,256,373.018,256c225.761,0,54.136,297.262-58.744,101.748 C427.154,553.262,83.906,553.262,196.786,357.748z"></path>
            <circle fill="#ff00d9ff" cx="255.711" cy="255.997" r="59.308"></circle>
        </svg>`;
    
    heart.style.position = 'fixed';
    heart.style.left = (e.clientX - 10) + 'px';
    heart.style.top = (e.clientY - 10) + 'px';
    heart.style.pointerEvents = 'none';
    heart.style.zIndex = '10000';
    heart.style.transition = 'transform 0.8s ease-out, opacity 0.8s ease-out';
    heart.style.opacity = '0.7';
    
    document.body.appendChild(heart);

    // Animation: Heart drifts up and spins slightly
    setTimeout(() => {
        heart.style.transform = `translateY(-40px) rotate(${Math.random() * 90 - 45}deg) scale(0.2)`;
        heart.style.opacity = '0';
    }, 50);

    // Remove from DOM
    setTimeout(() => {
        heart.remove();
    }, 800);
});

// --- SAKURA CANVAS EFFECT ---
const canvas = document.getElementById('sakura-canvas');
const ctx = canvas.getContext('2d');
let petals = [];

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

class Petal {
    constructor() {
        this.reset();
        this.y = Math.random() * canvas.height;
    }
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = -20;
        this.size = Math.random() * 5 + 2;
        this.speed = Math.random() * 1 + 0.5;
        this.angle = Math.random() * 360;
    }
    draw() {
        ctx.beginPath();
        ctx.fillStyle = "#dcd0ff"; 
        ctx.ellipse(this.x, this.y, this.size, this.size/1.5, this.angle, 0, Math.PI*2);
        ctx.fill();
    }
    update() {
        this.y += this.speed;
        this.x += Math.sin(this.y / 50);
        if (this.y > canvas.height) this.reset();
    }
}

for(let i=0; i<40; i++) petals.push(new Petal());

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    petals.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
}
animate();

// --- SPOTIFY / LANYARD LOGIC ---
let timer = null;
function format(ms) {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

/**
 * Main function to fetch Discord/Spotify status
 */
async function fetchStatus() {
    try {
        const res = await fetch(API_URL);
        const { data } = await res.json();

        // 1. Update Discord Status
        const statusBadge = document.getElementById('discord-status');
        if (statusBadge) statusBadge.textContent = data.discord_status.toUpperCase();

        // 2. Spotify Logic
        const spotifyBtn = document.querySelector('.sp-btn');
        const spotifyLink = document.getElementById('spotify-link');

        if (data.listening_to_spotify) {
            const s = data.spotify;
            const fullTrackUrl = `https://open.spotify.com/track/${s.track_id}`;

            // Show UI elements
            if (spotifyBtn) spotifyBtn.style.display = "block";
            document.getElementById('listening-status').textContent = "Currently Vibing...";
            document.getElementById('track-title').textContent = s.song;
            document.getElementById('artist-name').textContent = s.artist;
            document.getElementById('album-art').src = s.album_art_url;
            document.getElementById('album-name').textContent = s.album;
            
            // Set the link URL
            if (spotifyLink) spotifyLink.href = fullTrackUrl;

            // 3. Progress Bar Logic
            if (s.timestamps) {
                if (timer) clearInterval(timer);
                const duration = s.timestamps.end - s.timestamps.start;
                document.getElementById('total-time').textContent = format(duration);

                timer = setInterval(() => {
                    const elapsed = Date.now() - s.timestamps.start;
                    const progress = Math.min((elapsed / duration) * 100, 100);
                    
                    document.getElementById('progress-bar-fill').style.width = `${progress}%`;
                    document.getElementById('elapsed-time').textContent = format(Math.min(elapsed, duration));
                    
                    // Reset if song ends
                    if (elapsed >= duration) clearInterval(timer);
                }, 1000);
            }
        } else {
            // Hide Spotify info if not listening
            if (spotifyBtn) spotifyBtn.style.display = "none";
            document.getElementById('listening-status').textContent = "not listening rn.";
            if (timer) clearInterval(timer);
        }
    } catch (e) {
        console.error("Lanyard Error:", e);
    }
}

/**
 * Function called by the button click
 */
function openSpotify() {
    const spotifyLink = document.getElementById('spotify-link');
    if (spotifyLink && spotifyLink.href !== "#" && spotifyLink.href !== "") {
        window.open(spotifyLink.href, '_blank');
    } else {
        console.log("No active Spotify track link found.");
    }
}

// Start fetching and refresh every 30 seconds
fetchStatus();
setInterval(fetchStatus, 15000);

const clickSound = document.getElementById('click-sound');

document.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', function(e) {
        const targetUrl = this.href;
        const isNewTab = this.target === '_blank';

        // 1. Play the sound immediately
        clickSound.currentTime = 0;
        clickSound.play();

        // 2. If it's a real link, handle the navigation
        if (targetUrl && !targetUrl.includes('#')) {
            e.preventDefault(); // Stop the immediate jump

            setTimeout(() => {
                if (isNewTab) {
                    // Opens in a new tab/window
                    window.open(targetUrl, '_blank');
                } else {
                    // Opens in the same tab
                    window.location.href = targetUrl;
                }
            }, 150); // Small delay for the sound to play
        }
    });
});