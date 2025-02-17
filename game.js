// 游戏配置
const CONFIG = {
    SPEEDS: { easy: 200, normal: 150, hard: 100 },
    COLORS: {
        SNAKE_HEAD: '#4CAF50',
        SNAKE_BODY: '#69F0AE',
        FOOD: {
            normal: '#FF5252',
            bonus: '#FFD700',
            speed: '#00FFFF'
        }
    },
    POINTS: {
        normal: 10,
        bonus: 30,
        speed: 20
    },
    SCORE_MULTIPLIER: {
        easy: 1,
        normal: 2,
        hard: 3
    },
    GRID_SIZE: 20
};

// 蛇类
class Snake {
    constructor() {
        this.reset();
    }

    reset() {
        this.body = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 }
        ];
        this.direction = 'right';
        this.nextDirection = 'right';
    }

    move(food) {
        const head = { ...this.body[0] };

        switch (this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }

        this.body.unshift(head);

        if (head.x === food.x && head.y === food.y) {
            return true;
        }

        this.body.pop();
        return false;
    }

    checkCollision(gridSize) {
        const head = this.body[0];
        
        // 检查是否撞墙
        if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize) {
            return true;
        }

        // 检查是否撞到自己
        return this.body.slice(1).some(segment => 
            segment.x === head.x && segment.y === head.y
        );
    }

    changeDirection(newDirection) {
        const opposites = {
            up: 'down',
            down: 'up',
            left: 'right',
            right: 'left'
        };

        if (opposites[this.direction] !== newDirection) {
            this.nextDirection = newDirection;
        }
    }

    updateDirection() {
        this.direction = this.nextDirection;
    }
}

// 游戏类
class Game {
    constructor() {
        this.initializeCanvas();
        this.initializeGame();
        this.bindEvents();
        this.draw();
    }

    initializeCanvas() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.tileSize = this.canvas.width / CONFIG.GRID_SIZE;
    }

    initializeGame() {
        this.snake = new Snake();
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
        this.gameOver = false;
        this.isPaused = false;
        this.intervalId = null;
        this.difficulty = 'normal';
        this.foodTypes = ['normal', 'bonus', 'speed'];
        this.food = this.generateFood();
        this.updateScoreDisplay();
    }

    generateFood() {
        let food;
        do {
            food = {
                x: Math.floor(Math.random() * CONFIG.GRID_SIZE),
                y: Math.floor(Math.random() * CONFIG.GRID_SIZE),
                type: this.foodTypes[Math.floor(Math.random() * this.foodTypes.length)]
            };
        } while (this.snake.body.some(segment => 
            segment.x === food.x && segment.y === food.y));
        return food;
    }

    bindEvents() {
        this.bindKeyboardControls();
        this.bindButtonControls();
        this.bindDifficultyControl();
    }

    bindKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            e.preventDefault();
            
            const key = e.key.toLowerCase();
            
            if (key === ' ') {
                this.togglePause();
                return;
            }
            
            const directionMap = {
                arrowup: 'up',
                arrowdown: 'down',
                arrowleft: 'left',
                arrowright: 'right',
                w: 'up',
                s: 'down',
                a: 'left',
                d: 'right'
            };
            
            const newDirection = directionMap[key];
            if (newDirection) {
                this.snake.changeDirection(newDirection);
            }
        });
    }

    bindButtonControls() {
        document.getElementById('startButton').addEventListener('click', () => this.start());
        document.getElementById('pauseButton').addEventListener('click', () => this.togglePause());
        document.getElementById('restartButton').addEventListener('click', () => this.restart());
    }

    bindDifficultyControl() {
        document.getElementById('difficultySelect').addEventListener('change', (e) => {
            this.difficulty = e.target.value;
            if (this.intervalId) {
                this.start();
            }
        });
    }

    togglePause() {
        if (this.gameOver) return;

        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            clearInterval(this.intervalId);
            this.drawPauseScreen();
        } else {
            this.start();
        }
    }

    drawPauseScreen() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = 'white';
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('暂停', this.canvas.width / 2, this.canvas.height / 2);
    }

    drawSquare(x, y, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(
            x * this.tileSize,
            y * this.tileSize,
            this.tileSize - 1,
            this.tileSize - 1
        );
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制蛇
        this.snake.body.forEach((segment, index) => {
            this.drawSquare(
                segment.x,
                segment.y,
                index === 0 ? CONFIG.COLORS.SNAKE_HEAD : CONFIG.COLORS.SNAKE_BODY
            );
        });

        // 绘制食物
        this.drawSquare(this.food.x, this.food.y, CONFIG.COLORS.FOOD[this.food.type]);
    }

    update() {
        if (this.gameOver || this.isPaused) return;

        this.snake.updateDirection();
        const hasEaten = this.snake.move(this.food);

        if (hasEaten) {
            this.handleFoodEaten();
        }

        if (this.snake.checkCollision(CONFIG.GRID_SIZE)) {
            this.endGame();
        }
    }

    handleFoodEaten() {
        const basePoints = CONFIG.POINTS[this.food.type];
        const multiplier = CONFIG.SCORE_MULTIPLIER[this.difficulty];
        this.score += basePoints * multiplier;
        this.updateScoreDisplay();

        if (this.food.type === 'speed') {
            this.handleSpeedBoost();
        }

        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore);
            document.getElementById('highScore').textContent = `最高分: ${this.highScore}`;
        }

        this.food = this.generateFood();
    }

    handleSpeedBoost() {
        const currentSpeed = CONFIG.SPEEDS[this.difficulty];
        CONFIG.SPEEDS[this.difficulty] = Math.max(currentSpeed * 0.8, 50);
        this.start();

        setTimeout(() => {
            CONFIG.SPEEDS[this.difficulty] = currentSpeed;
            if (!this.gameOver) this.start();
        }, 5000);
    }

    updateScoreDisplay() {
        const multiplier = CONFIG.SCORE_MULTIPLIER[this.difficulty];
        document.getElementById('score').textContent = `分数: ${this.score} (${multiplier}倍得分)`;
    }

    endGame() {
        this.gameOver = true;
        clearInterval(this.intervalId);
        
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalHighScore').textContent = this.highScore;
        document.getElementById('gameOver').style.display = 'block';
        document.getElementById('overlay').style.display = 'block';
    }

    restart() {
        this.snake.reset();
        this.food = this.generateFood();
        this.score = 0;
        this.gameOver = false;
        this.isPaused = false;
        this.updateScoreDisplay();
        document.getElementById('gameOver').style.display = 'none';
        document.getElementById('overlay').style.display = 'none';
        document.getElementById('startButton').style.display = 'block';
        this.draw();
    }

    start() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }

        if (!this.gameOver && !this.isPaused) {
            this.intervalId = setInterval(() => {
                this.update();
                this.draw();
            }, CONFIG.SPEEDS[this.difficulty]);
            document.getElementById('startButton').style.display = 'none';
        }
    }
}

// 初始化游戏
window.onload = () => new Game();