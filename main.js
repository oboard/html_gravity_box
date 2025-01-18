import Matter from 'matter-js';

const colors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
  '#D4A5A5', '#9B59B6', '#3498DB', '#E74C3C', '#1ABC9C',
  '#F1C40F', '#2ECC71', '#E67E22', '#95A5A6', '#34495E',
  '#16A085', '#27AE60', '#2980B9', '#8E44AD', '#F39C12'
];

const avatarUrl = 'https://obscloud.ulearning.cn/resources/web/1737200386367.png';

let isDarkMode = "%darkMode%";
if (typeof isDarkMode === "string") {
  isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
}
let rawData = "%data%";

if (typeof rawData === "string") {
  rawData = [
    {
      "name": "ticking",
      "startTime": 1720019307860,
      "endTime": 1720024961299,
      "pauseTotalTime": 0,
      "type": 2,
      "dayNum": 19907,
      "state": 0,
    },
    // {
    //   "name": "ticking",
    //   "userId": 3,
    //   "startTime": 1720016880000,
    //   "endTime": 1720018810000,
    //   "type": 2,
    //   "pauseTotalTime": 0,
    //   "dayNum": 19907,
    //   "state": 0,
    // },
    // {
    //   "name": "milthm",
    //   "startTime": 1720004400000,
    //   "endTime": 1720008010000,
    //   "type": 2,
    //   "pauseTotalTime": 0,
    //   "dayNum": 19907,
    //   "state": 0,
    // },
  ]
}

rawData = rawData.filter((item) => ([0, 2, 4].includes(item.type)));

// 转换为名字和数量
const eventCount = {};

for (let item of rawData) {
  if (!eventCount[item.name]) eventCount[item.name] = 1;
  eventCount[item.name] += item.endTime - item.startTime - item.pauseTotalTime;
}

const result = Object.keys(eventCount).map(name => ({
  name: name,
  value: eventCount[name]
}));



// Matter.js module aliases
const { Engine, Render, Bodies, Composite, Mouse, MouseConstraint } = Matter;

// Create engine and world
const engine = Engine.create();
const world = engine.world;

// Create renderer
const render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    width: window.innerWidth,
    height: window.innerHeight,
    wireframes: false,
    background: 'transparent'
  }
});

// Create walls
const wallThickness = 50;
const wallColor = '#00000000';
const wallRender = {
  fillStyle: wallColor,
  strokeStyle: wallColor,
  lineWidth: 2
}
const wallProperties = {
  isStatic: true,
  render: wallRender,
  friction: 0.5,
  restitution: 0.2
}
const walls = [
  // Bottom
  Bodies.rectangle(window.innerWidth / 2, window.innerHeight + wallThickness / 4, window.innerWidth + wallThickness * 2, wallThickness, {
    ...wallProperties,
  }),
  // Top
  Bodies.rectangle(window.innerWidth / 2, -wallThickness / 4, window.innerWidth + wallThickness * 2, wallThickness, {
    ...wallProperties,
  }),
  // Left
  Bodies.rectangle(-wallThickness / 4, window.innerHeight / 2, wallThickness, window.innerHeight + wallThickness * 2, {
    ...wallProperties,
  }),
  // Right
  Bodies.rectangle(window.innerWidth + wallThickness / 4, window.innerHeight / 2, wallThickness, window.innerHeight + wallThickness * 2, {
    ...wallProperties,
  })
];

// Add walls to world
Composite.add(world, walls);

// Create circular avatars with varying sizes
const baseSize = Math.min(window.innerWidth, window.innerHeight) * 0.08; // 增大基础大小

// 添加一个名字数组

// 设置头像总数为实际数据量
const totalAvatars = result.length;

// 计算数值范围用于缩放
const values = result.map(r => r.value);
const maxValue = Math.max(...values);
const minValue = Math.min(...values);

// 添加一个时间格式化函数
function formatDuration(milliseconds) {
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

  let result = '';
  if (hours > 0) {
    result += `${hours}小时`;
  }
  if (minutes > 0 || hours === 0) {
    result += `${minutes}分钟`;
  }
  return result;
}

// Create and add avatars with improved physics
for (let i = 0; i < totalAvatars; i++) {
  // 根据数值计算大小
  const normalizedValue = result.length === 1 ? 2 : (result[i].value - minValue) / (maxValue - minValue);
  const size = baseSize * (0.5 + normalizedValue); // 确保最小也有基础大小的50%

  // 计算均衡的起始位置
  const gridCols = Math.ceil(Math.sqrt(totalAvatars));
  const spacing = window.innerWidth / (gridCols + 1);
  const col = i % gridCols;

  const avatar = Bodies.circle(
    spacing * (col + 1),
    size,
    size / 2,
    {
      restitution: 0.2,
      friction: 0.5,
      density: 0.1 * (1 + normalizedValue),
      frictionAir: 0.01,
      slop: 0.01,
      angularVelocity: 0.001,
      render: {
        fillStyle: colors[i % colors.length],
        sprite: {
          texture: avatarUrl,
          xScale: size / 150,
          yScale: size / 150
        }
      },
      label: 'avatar',
      userName: `${result[i].name}\n${formatDuration(result[i].value)}`,
      eventValue: result[i].value
    }
  );

  // 创建后立即进行缩放以形成椭圆
  Matter.Body.scale(avatar, 2, 1.6);

  Composite.add(world, avatar);
}

// 修改名字显示的样式以支持换行
const nameDisplay = document.createElement('div');
nameDisplay.style.cssText = `
  position: fixed;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border-radius: 4px;
  font-size: 16px;
  pointer-events: none;
  display: none;
  z-index: 1000;
  white-space: pre-line;
  text-align: center;
`;
document.body.appendChild(nameDisplay);

// 在创建renderer之后添加鼠标控制
// Add mouse control
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
  mouse: mouse,
  constraint: {
    stiffness: 0.2,
    render: {
      visible: false
    }
  }
});

// 保持鼠标位置同步
render.mouse = mouse;

// 添加鼠标约束到世界
Composite.add(world, mouseConstraint);

// 修改事件处理，同时支持鼠标和触摸
function updateNameDisplay(event, body) {
  if (body && body.label === 'avatar') {
    nameDisplay.textContent = body.userName;
    nameDisplay.style.display = 'block';
    // 获取正确的坐标，支持触摸和鼠标事件
    const clientX = event.clientX || event.touches[0].clientX;
    const clientY = event.clientY || event.touches[0].clientY;
    nameDisplay.style.left = `${clientX}px`;
    nameDisplay.style.top = `${clientY - 30}px`;
  } else {
    nameDisplay.style.display = 'none';
  }
}

// 鼠标移动事件
render.canvas.addEventListener('mousemove', (event) => {
  if (mouseConstraint.body) {
    updateNameDisplay(event, mouseConstraint.body);
  }
});

render.canvas.addEventListener('touchstart', (event) => {
  if (mouseConstraint.body) {
    updateNameDisplay(event, mouseConstraint.body);
  }
});

// 添加触摸事件处理
render.canvas.addEventListener('touchmove', (event) => {
  if (mouseConstraint.body) {
    event.preventDefault(); // 防止页面滚动
    updateNameDisplay(event, mouseConstraint.body);
  }
});

render.canvas.addEventListener('touchend', () => {
  nameDisplay.style.display = 'none';
});

render.canvas.addEventListener('mouseleave', () => {
  nameDisplay.style.display = 'none';
});

// Handle device orientation with permission
if (window.DeviceOrientationEvent) {
  let orientationPermission = false;

  // 创建一个异步函数来处理权限请求
  const requestOrientationPermission = async () => {
    try {
      // Request permission
      if (DeviceOrientationEvent.requestPermission) {
        const permission = await DeviceOrientationEvent.requestPermission();
        orientationPermission = permission === 'granted';
      } else {
        // For devices that don't require permission
        orientationPermission = true;
      }
    } catch (error) {
      // console.error('Error requesting device orientation permission:', error);
    }
  };

  // 立即执行权限请求
  requestOrientationPermission();

  window.addEventListener('deviceorientation', function (event) {
    if (!orientationPermission) return;

    const gravity = engine.world.gravity;

    if (event.gamma && event.beta) {
      const gamma = event.gamma * Math.PI / 180;
      const beta = event.beta * Math.PI / 180;

      const scale = 0.001;

      gravity.x = Math.sin(gamma) * scale;
      gravity.y = Math.sin(beta) * scale;
    }
  });
} else {
  // console.log('Device orientation not supported');
}

// Handle mouse/touch movement as fallback
let isDragging = false;
let previousX = 0;
let previousY = 0;

document.addEventListener('mousedown', (e) => {
  isDragging = true;
  previousX = e.clientX;
  previousY = e.clientY;
});

document.addEventListener('mousemove', (e) => {
  if (isDragging) {
    // const deltaX = e.clientX - previousX;
    // const deltaY = e.clientY - previousY;

    // engine.gravity.x = deltaX * 0.001;
    // engine.gravity.y = deltaY * 0.001;

    previousX = e.clientX;
    previousY = e.clientY;
  }
});

document.addEventListener('mouseup', () => {
  isDragging = false;
});

// Handle window resize
window.addEventListener('resize', () => {
  render.canvas.width = window.innerWidth;
  render.canvas.height = window.innerHeight;

  // 计算新的基础大小
  // const newBaseSize = Math.min(window.innerWidth, window.innerHeight) * 0.08;

  // // 更新所有头像的大小
  // const bodies = Composite.allBodies(world);
  // bodies.forEach(body => {
  //   if (body.label === 'avatar') {
  //     const scale = newBaseSize / 80; // 80是原始图片的参考大小
  //     const currentRadius = body.circleRadius;
  //     const newRadius = newBaseSize / 2;

  //     // 更新物理体的大小
  //     Matter.Body.scale(body, newRadius / currentRadius, newRadius / currentRadius);

  //     // 更新渲染精灵的大小
  //     if (body.render.sprite) {
  //       body.render.sprite.xScale = scale;
  //       body.render.sprite.yScale = scale;
  //     }
  //   }
  // });

  // 更新墙的位置和大小
  walls.forEach((wall, index) => {
    switch (index) {
      case 0: // Bottom wall
        Matter.Body.setPosition(wall, {
          x: window.innerWidth / 2,
          y: window.innerHeight + wallThickness / 4
        });
        Matter.Body.setVertices(wall, Bodies.rectangle(
          window.innerWidth / 2,
          window.innerHeight + wallThickness / 4,
          window.innerWidth + wallThickness * 2,
          wallThickness
        ).vertices);
        break;
      case 1: // Top wall
        Matter.Body.setPosition(wall, {
          x: window.innerWidth / 2,
          y: -wallThickness / 4
        });
        Matter.Body.setVertices(wall, Bodies.rectangle(
          window.innerWidth / 2,
          -wallThickness / 4,
          window.innerWidth + wallThickness * 2,
          wallThickness
        ).vertices);
        break;
      case 2: // Left wall
        Matter.Body.setPosition(wall, {
          x: -wallThickness / 4,
          y: window.innerHeight / 2
        });
        Matter.Body.setVertices(wall, Bodies.rectangle(
          -wallThickness / 4,
          window.innerHeight / 2,
          wallThickness,
          window.innerHeight + wallThickness * 2
        ).vertices);
        break;
      case 3: // Right wall
        Matter.Body.setPosition(wall, {
          x: window.innerWidth + wallThickness / 4,
          y: window.innerHeight / 2
        });
        Matter.Body.setVertices(wall, Bodies.rectangle(
          window.innerWidth + wallThickness / 4,
          window.innerHeight / 2,
          wallThickness,
          window.innerHeight + wallThickness * 2
        ).vertices);
        break;
    }
  });
});

// Run the engine and renderer
Matter.Runner.run(engine);
Render.run(render);