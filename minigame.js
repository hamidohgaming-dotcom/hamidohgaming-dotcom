/**
 * NEON ARCADE: CYBER DODGER
 * Interactive HTML5 Canvas Runner with Particle Effects, Power Orbs, and Audio.
 */

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('gameOverlay');
  const startBtn = document.getElementById('startGameBtn');
  const overlayTitle = document.getElementById('overlayTitle');
  const overlaySubtitle = document.getElementById('overlaySubtitle');
  const currentScoreEl = document.getElementById('currentScore');
  const highScoreEl = document.getElementById('highScore');

  // Game Dimensions
  const WIDTH = 800;
  const HEIGHT = 400;
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  // Game State
  let isPlaying = false;
  let isGameOver = false;
  let score = 0;
  let highScore = parseInt(localStorage.getItem('hamidoh_arcade_highscore') || '0', 10);
  highScoreEl.textContent = String(highScore).padStart(4, '0');

  let gameSpeed = 5;
  let frames = 0;
  let animId = null;

  // Particle System
  let particles = [];

  class Particle {
    constructor(x, y, color) {
      this.x = x;
      this.y = y;
      this.vx = (Math.random() - 0.5) * 6;
      this.vy = (Math.random() - 0.5) * 6;
      this.size = Math.random() * 4 + 2;
      this.color = color;
      this.alpha = 1;
      this.decay = Math.random() * 0.03 + 0.015;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.alpha -= this.decay;
    }

    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.alpha);
      ctx.fillStyle = this.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = this.color;
      ctx.fillRect(this.x, this.y, this.size, this.size);
      ctx.restore();
    }
  }

  function spawnExplosion(x, y, color, count = 20) {
    for (let i = 0; i < count; i++) {
      particles.push(new Particle(x, y, color));
    }
  }

  // Player Object
  const player = {
    x: 80,
    y: HEIGHT - 80,
    width: 34,
    height: 38,
    vy: 0,
    gravity: 0.7,
    jumpStrength: -12.5,
    isGrounded: false,
    jumpsLeft: 2,
    trail: [],

    reset() {
      this.y = HEIGHT - 80;
      this.vy = 0;
      this.isGrounded = true;
      this.jumpsLeft = 2;
      this.trail = [];
    },

    jump() {
      if (this.jumpsLeft > 0) {
        this.vy = this.jumpStrength;
        this.jumpsLeft--;
        this.isGrounded = false;
        if (window.GameAudio) window.GameAudio.jump();
        spawnExplosion(this.x + this.width / 2, this.y + this.height, '#00f3ff', 8);
      }
    },

    update() {
      this.vy += this.gravity;
      this.y += this.vy;

      // Ground Collision
      const floorY = HEIGHT - 60 - this.height;
      if (this.y >= floorY) {
        this.y = floorY;
        this.vy = 0;
        this.isGrounded = true;
        this.jumpsLeft = 2;
      }

      // Record trail
      this.trail.unshift({ x: this.x, y: this.y });
      if (this.trail.length > 6) this.trail.pop();
    },

    draw(ctx) {
      // Draw neon motion blur trail
      for (let i = 0; i < this.trail.length; i++) {
        const t = this.trail[i];
        ctx.save();
        ctx.globalAlpha = 0.3 - (i * 0.04);
        ctx.fillStyle = '#00f3ff';
        ctx.fillRect(t.x, t.y, this.width, this.height);
        ctx.restore();
      }

      // Draw Main Player Body
      ctx.save();
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00f3ff';
      ctx.fillStyle = '#00f3ff';
      ctx.fillRect(this.x, this.y, this.width, this.height);

      // Player Visor / Inner Glow
      ctx.fillStyle = '#fff';
      ctx.fillRect(this.x + 14, this.y + 8, 16, 6);

      // Cyber Jet Core
      ctx.fillStyle = '#ff007f';
      ctx.shadowColor = '#ff007f';
      ctx.fillRect(this.x + 4, this.y + 20, 8, 12);
      ctx.restore();
    }
  };

  // Obstacles & Collectibles
  let obstacles = [];
  let orbs = [];

  class Obstacle {
    constructor() {
      this.width = Math.floor(Math.random() * 15) + 22;
      this.height = Math.floor(Math.random() * 35) + 35;
      this.x = WIDTH + 50;
      this.y = HEIGHT - 60 - this.height;
      this.color = '#ff007f';
    }

    update() {
      this.x -= gameSpeed;
    }

    draw(ctx) {
      ctx.save();
      ctx.shadowBlur = 12;
      ctx.shadowColor = this.color;
      ctx.fillStyle = this.color;

      // Draw cyber spire shape
      ctx.beginPath();
      ctx.moveTo(this.x + this.width / 2, this.y);
      ctx.lineTo(this.x + this.width, this.y + this.height);
      ctx.lineTo(this.x, this.y + this.height);
      ctx.closePath();
      ctx.fill();

      // Top energy tip
      ctx.fillStyle = '#fff';
      ctx.fillRect(this.x + this.width / 2 - 2, this.y - 4, 4, 6);
      ctx.restore();
    }
  }

  class EnergyOrb {
    constructor() {
      this.size = 12;
      this.x = WIDTH + 40;
      this.y = HEIGHT - 120 - Math.random() * 80;
      this.color = '#ffb703';
      this.pulse = 0;
    }

    update() {
      this.x -= gameSpeed;
      this.pulse += 0.08;
    }

    draw(ctx) {
      ctx.save();
      const currentRadius = this.size + Math.sin(this.pulse) * 3;
      ctx.shadowBlur = 15;
      ctx.shadowColor = this.color;
      ctx.fillStyle = this.color;

      ctx.beginPath();
      ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
      ctx.fill();

      // Inner white spark
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(this.x, this.y, currentRadius / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Background Grid Floor
  function drawFloor(ctx) {
    const floorY = HEIGHT - 60;
    ctx.save();

    // Floor Base Line
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00f3ff';
    ctx.beginPath();
    ctx.moveTo(0, floorY);
    ctx.lineTo(WIDTH, floorY);
    ctx.stroke();

    // Floor Underglow
    ctx.fillStyle = 'rgba(0, 243, 255, 0.05)';
    ctx.fillRect(0, floorY, WIDTH, 60);

    // Moving Grid Marks
    const offset = (frames * gameSpeed) % 40;
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.3)';
    ctx.lineWidth = 1;
    for (let x = -offset; x < WIDTH; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, floorY);
      ctx.lineTo(x - 20, HEIGHT);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Collision Detection
  function checkCollision(r1, r2) {
    return (
      r1.x < r2.x + r2.width &&
      r1.x + r1.width > r2.x &&
      r1.y < r2.y + r2.height &&
      r1.y + r1.height > r2.y
    );
  }

  function checkOrbCollision(p, orb) {
    const distX = Math.abs(orb.x - (p.x + p.width / 2));
    const distY = Math.abs(orb.y - (p.y + p.height / 2));
    return distX < p.width / 2 + orb.size && distY < p.height / 2 + orb.size;
  }

  // Game Loop
  function gameLoop() {
    frames++;
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // Speed scaling
    if (frames % 400 === 0 && gameSpeed < 11) {
      gameSpeed += 0.4;
    }

    // Spawn Obstacles
    if (frames % 95 === 0) {
      obstacles.push(new Obstacle());
    }

    // Spawn Energy Orbs
    if (frames % 140 === 0 && Math.random() > 0.3) {
      orbs.push(new EnergyOrb());
    }

    // Draw Environment
    drawFloor(ctx);

    // Update & Draw Player
    player.update();
    player.draw(ctx);

    // Update & Draw Obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.update();
      obs.draw(ctx);

      // Check Collision with Player
      if (checkCollision(player, obs)) {
        gameOver();
        return;
      }

      // Remove offscreen
      if (obs.x + obs.width < 0) {
        obstacles.splice(i, 1);
        score += 10;
        updateScoreDisplay();
      }
    }

    // Update & Draw Orbs
    for (let i = orbs.length - 1; i >= 0; i--) {
      const orb = orbs[i];
      orb.update();
      orb.draw(ctx);

      // Check Pickup
      if (checkOrbCollision(player, orb)) {
        score += 50;
        updateScoreDisplay();
        if (window.GameAudio) window.GameAudio.coin();
        spawnExplosion(orb.x, orb.y, '#ffb703', 15);
        orbs.splice(i, 1);
        continue;
      }

      // Remove offscreen
      if (orb.x + orb.size < 0) {
        orbs.splice(i, 1);
      }
    }

    // Update & Draw Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update();
      p.draw(ctx);
      if (p.alpha <= 0) particles.splice(i, 1);
    }

    // Passive Distance Score
    if (frames % 10 === 0) {
      score += 1;
      updateScoreDisplay();
    }

    if (isPlaying) {
      animId = requestAnimationFrame(gameLoop);
    }
  }

  function updateScoreDisplay() {
    currentScoreEl.textContent = String(score).padStart(4, '0');
    if (score > highScore) {
      highScore = score;
      highScoreEl.textContent = String(highScore).padStart(4, '0');
      localStorage.setItem('hamidoh_arcade_highscore', highScore);
    }
  }

  function startGame() {
    isGameOver = false;
    isPlaying = true;
    score = 0;
    gameSpeed = 5.2;
    frames = 0;
    obstacles = [];
    orbs = [];
    particles = [];
    player.reset();
    updateScoreDisplay();

    overlay.classList.add('hidden');
    if (window.GameAudio) window.GameAudio.powerup();

    if (animId) cancelAnimationFrame(animId);
    animId = requestAnimationFrame(gameLoop);
  }

  function gameOver() {
    isPlaying = false;
    isGameOver = true;
    if (animId) cancelAnimationFrame(animId);

    if (window.GameAudio) window.GameAudio.hit();
    spawnExplosion(player.x + player.width / 2, player.y + player.height / 2, '#ff007f', 35);

    // Draw final explosion frame
    for (let p of particles) {
      p.update();
      p.draw(ctx);
    }

    overlayTitle.textContent = "MISSION FAILED";
    overlayTitle.style.color = "var(--neon-secondary)";
    overlaySubtitle.textContent = `FINAL SCORE: ${score} PTS | RECORD: ${highScore} PTS`;
    startBtn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> PLAY AGAIN';
    overlay.classList.remove('hidden');
  }

  // Controls Event Listeners
  function handleJump(e) {
    if (e.type === 'keydown') {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (isPlaying) {
          player.jump();
        } else if (isGameOver || !isPlaying) {
          startGame();
        }
      }
    } else {
      // Touch or Click on canvas
      if (isPlaying) {
        player.jump();
      }
    }
  }

  window.addEventListener('keydown', handleJump);
  canvas.addEventListener('click', handleJump);
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleJump(e);
  }, { passive: false });

  if (startBtn) {
    startBtn.addEventListener('click', startGame);
  }

  // Initial Floor Render
  drawFloor(ctx);
});
