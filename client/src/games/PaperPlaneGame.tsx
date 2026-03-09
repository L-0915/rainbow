import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';

interface Point {
  x: number;
  y: number;
}

interface DrawingPath {
  points: Point[];
  color: string;
  strokeWidth: number;
  id: number;
  isEraser?: boolean;
}

// 更多预设颜色 - 5 行 x6 列=30 种颜色
const PRESET_COLORS = [
  // 第一行 - 暖色调
  '#FF6B6B', '#FF8E8E', '#FFB3B3', '#FFD43B', '#FFA94D', '#FF85A2',
  // 第二行 - 绿色调
  '#69DB7C', '#8CE99A', '#A3EBA0', '#51CF66', '#40C057', '#37B24D',
  // 第三行 - 蓝色调
  '#4DABF7', '#74C0FC', '#91D5F8', '#339AF0', '#228BE6', '#1C7ED6',
  // 第四行 - 紫色调
  '#DA77F2', '#E599F7', '#EEBEF7', '#B197FC', '#9775FA', '#845EF7',
  // 第五行 - 其他
  '#F783AC', '#F06595', '#E599A7', '#D68C8D', '#C9B59D', '#A8E6CF',
];

const STROKE_WIDTHS = [4, 8, 12, 16];

// 鼓励语料库
const ENCOURAGEMENTS = [
  '你的话飞走了，它会找到想听的人。✨',
  '每一份心意，都会被听见。💕',
  '勇敢地表达自己，你很棒！🌈',
  '这些话，会带着你的心意飞向远方。🕊️',
  '有人正在等着听你想说的话呢。💖',
  '你的声音，很重要。🌟',
  '把心意折成纸飞机，让它带去你的思念。✈️',
  '世界会听见你的声音。🎵',
];

export const PaperPlaneGame = () => {
  const navigateTo = useAppStore((state) => state.navigateTo);
  const endGame = useAppStore((state) => state.endGame);

  // 游戏状态
  const [gamePhase, setGamePhase] = useState<'drawing' | 'ready' | 'flying' | 'finished'>('drawing');

  // 绘制状态
  const [isDrawing, setIsDrawing] = useState(false);
  const [paths, setPaths] = useState<DrawingPath[]>([]);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>(PRESET_COLORS[0]);
  const [selectedStrokeWidth, setSelectedStrokeWidth] = useState<number>(8);
  const [eraserStrokeWidth, setEraserStrokeWidth] = useState<number>(16);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showStrokePicker, setShowStrokePicker] = useState(false);
  const [showEraserPicker, setShowEraserPicker] = useState(false);
  const [isEraserMode, setIsEraserMode] = useState(false);
  const [hasStartedDrawing, setHasStartedDrawing] = useState(false);

  // 画布尺寸 - 响应式
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // 纸飞机状态
  const [planePosition, setPlanePosition] = useState<Point>({ x: 100, y: 300 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [dragCurrent, setDragCurrent] = useState<Point | null>(null);
  const [throwVelocity, setThrowVelocity] = useState<Point | null>(null);

  // 飞行状态
  const [planeFlightPath, setPlaneFlightPath] = useState<Point[]>([]);
  const [showMessage, setShowMessage] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 更新画布尺寸
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setCanvasSize({ width, height });
        if (canvasRef.current) {
          canvasRef.current.width = width;
          canvasRef.current.height = height;
        }
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // 获取坐标
  const getPointerPos = useCallback((e: React.PointerEvent | PointerEvent): Point => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  // 绘制处理
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (gamePhase !== 'drawing') return;
    const pos = getPointerPos(e);

    // 检查是否在工具栏区域（底部 100px）
    if (pos.y > window.innerHeight - 120) return;

    setIsDrawing(true);
    setCurrentPath([pos]);
    setHasStartedDrawing(true);
  }, [gamePhase, getPointerPos]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDrawing || gamePhase !== 'drawing') return;
    e.preventDefault();
    const pos = getPointerPos(e);
    setCurrentPath(prev => [...prev, pos]);
  }, [isDrawing, gamePhase, getPointerPos]);

  const handlePointerUp = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPath.length > 1) {
      setPaths(prev => [...prev, {
        points: currentPath,
        color: isEraserMode ? 'transparent' : selectedColor,
        strokeWidth: isEraserMode ? eraserStrokeWidth : selectedStrokeWidth,
        id: Date.now(),
        isEraser: isEraserMode,
      }]);
    }
    setCurrentPath([]);
  }, [isDrawing, currentPath, selectedColor, selectedStrokeWidth, eraserStrokeWidth, isEraserMode]);

  // 纸飞机拖拽处理
  const handlePlanePointerDown = useCallback((e: React.PointerEvent) => {
    if (gamePhase !== 'ready') return;
    e.stopPropagation();
    setIsDragging(true);
    const pos = getPointerPos(e);
    setDragStart(pos);
    setDragCurrent(pos);
  }, [gamePhase, getPointerPos]);

  const handlePlanePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !dragStart) return;
    const pos = getPointerPos(e);
    setDragCurrent(pos);

    // 计算投掷力度和方向
    const dx = dragStart.x - pos.x;
    const dy = dragStart.y - pos.y;
    setThrowVelocity({ x: dx * 0.15, y: dy * 0.15 });
  }, [isDragging, dragStart, getPointerPos]);

  const handlePlanePointerUp = useCallback(() => {
    if (!isDragging || !dragStart || !dragCurrent) {
      setIsDragging(false);
      setDragStart(null);
      setDragCurrent(null);
      setThrowVelocity(null);
      return;
    }

    // 计算投掷速度
    const dx = dragStart.x - dragCurrent.x;
    const dy = dragStart.y - dragCurrent.y;
    const speed = Math.sqrt(dx * dx + dy * dy);

    // 需要最小投掷力度
    if (speed > 30) {
      // 开始飞行
      setGamePhase('flying');
      setThrowVelocity({
        x: dx * 0.12,
        y: dy * 0.12
      });
    }

    setIsDragging(false);
    setDragStart(null);
    setDragCurrent(null);
  }, [isDragging, dragStart, dragCurrent]);

  // 飞行动画
  useEffect(() => {
    if (gamePhase !== 'flying') return;

    let progress = 0;
    const startPos = planePosition;
    const velocity = throwVelocity || { x: 15, y: -10 };

    // 计算目标位置（屏幕外右上方）
    const targetX = window.innerWidth + 100;
    const targetY = Math.max(-100, startPos.y + velocity.y * 8);

    // 预计算飞行路径点（用于显示轨迹）
    const pathPoints: Point[] = [];

    const animate = () => {
      progress += 0.02;

      if (progress >= 1) {
        setGamePhase('finished');
        setCurrentMessage(ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]);
        setShowMessage(true);
        return;
      }

      // 抛物线飞行轨迹 - 使用更平滑的弧线
      const currentX = startPos.x + (targetX - startPos.x) * progress;
      // 使用抛物线：先上升后平缓
      const arcHeight = Math.sin(progress * Math.PI) * 150;
      const currentY = startPos.y + (targetY - startPos.y) * progress - arcHeight;

      // 纸飞机旋转 - 更平滑
      const rotation = Math.atan2(-arcHeight * 0.3, targetX - startPos.x) * (180 / Math.PI);

      setPlanePosition({ x: currentX, y: currentY });

      // 减少轨迹点更新频率
      if (Math.floor(progress * 100) % 5 === 0) {
        pathPoints.push({ x: currentX, y: currentY });
        setPlaneFlightPath([...pathPoints]);
      }

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [gamePhase, throwVelocity]);

  // 清除绘画
  const clearDrawing = useCallback(() => {
    setPaths([]);
    setCurrentPath([]);
    setHasStartedDrawing(false);
  }, []);

  // 完成绘制，进入投掷阶段
  const finishDrawing = useCallback(() => {
    setGamePhase('ready');
    // 设置纸飞机初始位置（屏幕左侧，响应式）
    const canvasWidth = containerRef.current?.getBoundingClientRect().width || window.innerWidth;
    const canvasHeight = containerRef.current?.getBoundingClientRect().height || window.innerHeight;
    setPlanePosition({ x: canvasWidth * 0.15, y: canvasHeight * 0.6 });
  }, []);

  // 返回
  const handleBack = useCallback(() => {
    endGame();
    navigateTo('playground');
  }, [endGame, navigateTo]);

  // 再来一次
  const handleRestart = useCallback(() => {
    setGamePhase('drawing');
    setPaths([]);
    setPlanePosition({ x: 100, y: 300 });
    setPlaneFlightPath([]);
    setShowMessage(false);
    setThrowVelocity(null);
    setHasStartedDrawing(false);
    setIsEraserMode(false);
  }, []);

  // 渲染画布
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置画布尺寸
    canvas.width = canvasSize.width || window.innerWidth;
    canvas.height = canvasSize.height || window.innerHeight;

    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制已完成的线条
    paths.forEach(path => {
      if (path.points.length < 2) return;

      if (path.isEraser) {
        // 橡皮擦模式 - 使用 destination-out 清除
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = path.color;
      }

      ctx.lineWidth = path.strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(path.points[0].x, path.points[0].y);

      // 使用二次贝塞尔曲线使线条更平滑
      for (let i = 1; i < path.points.length - 1; i++) {
        const xc = (path.points[i].x + path.points[i + 1].x) / 2;
        const yc = (path.points[i].y + path.points[i + 1].y) / 2;
        ctx.quadraticCurveTo(path.points[i].x, path.points[i].y, xc, yc);
      }

      // 连接最后一个点
      if (path.points.length > 2) {
        ctx.lineTo(path.points[path.points.length - 1].x, path.points[path.points.length - 1].y);
      }

      ctx.stroke();
    });

    // 绘制当前线条
    if (currentPath.length > 1) {
      if (isEraserMode) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = selectedColor;
      }
      ctx.lineWidth = selectedStrokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(currentPath[0].x, currentPath[0].y);

      for (let i = 1; i < currentPath.length - 1; i++) {
        const xc = (currentPath[i].x + currentPath[i + 1].x) / 2;
        const yc = (currentPath[i].y + currentPath[i + 1].y) / 2;
        ctx.quadraticCurveTo(currentPath[i].x, currentPath[i].y, xc, yc);
      }

      if (currentPath.length > 2) {
        ctx.lineTo(currentPath[currentPath.length - 1].x, currentPath[currentPath.length - 1].y);
      }

      ctx.stroke();
    }

    ctx.globalCompositeOperation = 'source-over';

    // 绘制飞行轨迹
    if (planeFlightPath.length > 1) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 5]);
      ctx.beginPath();
      ctx.moveTo(planeFlightPath[0].x, planeFlightPath[0].y);
      planeFlightPath.forEach(point => ctx.lineTo(point.x, point.y));
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [paths, currentPath, selectedColor, selectedStrokeWidth, planeFlightPath, isEraserMode, canvasSize]);

  // 工具栏按钮基础样式（响应式）
  const toolButtonClass = "backdrop-blur-xl rounded-full shadow-lg border-4 border-white flex items-center justify-center transition-transform active:scale-95";

  // 绘制阶段
  if (gamePhase === 'drawing') {
    return (
      <div
        className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-sky-200 via-blue-100 to-green-100 touch-none"
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <canvas ref={canvasRef} className="absolute inset-0" />

        {/* 顶部导航 */}
        <motion.div
          className="absolute top-2 left-2 right-2 z-50 flex items-center justify-between"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <motion.button
            onClick={handleBack}
            className="bg-white/80 backdrop-blur-xl px-4 py-2 rounded-full shadow-xl font-black text-gray-700 border-4 border-white/60 text-sm md:text-base"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
          >
            ← 返回
          </motion.button>
          <motion.div
            className="bg-gradient-to-r from-green-400 to-blue-400 backdrop-blur-xl px-4 py-2 rounded-full shadow-2xl border-4 border-white/60"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-base md:text-xl font-black text-white drop-shadow-lg">✈️ 纸飞机</span>
          </motion.div>
          <div className="w-10 md:w-20" />
        </motion.div>

        {/* 提示 - 开始绘画后消失 */}
        <AnimatePresence>
          {!hasStartedDrawing && (
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              exit={{ opacity: 0 }}
            >
              <p className="text-xl md:text-2xl font-black text-gray-600/60">
                在屏幕上画你想说的话
              </p>
              <p className="text-sm md:text-base text-gray-500 mt-2">
                可以是图形、符号、或者任何你想表达的～
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 工具栏 */}
        <motion.div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="flex items-center gap-2 bg-white/60 backdrop-blur-xl rounded-full px-3 py-2 shadow-xl border-4 border-white/60">
            {/* 颜色选择器 */}
            <div className="relative">
              <motion.button
                onClick={() => {
                  setShowColorPicker(!showColorPicker);
                  setShowStrokePicker(false);
                  setShowEraserPicker(false);
                }}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full shadow-lg border-4 border-white flex items-center justify-center text-lg md:text-xl overflow-hidden"
                style={{ backgroundColor: selectedColor }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="drop-shadow-lg">🎨</span>
              </motion.button>

              <AnimatePresence>
                {showColorPicker && (
                  <motion.div
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white/95 backdrop-blur-xl rounded-2xl p-3 shadow-2xl border-4 border-white/60 z-50 w-64"
                    initial={{ scale: 0, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0, opacity: 0, y: 10 }}
                  >
                    <p className="text-xs font-bold text-gray-500 mb-2 text-center">选择颜色</p>
                    {/* 预设颜色网格 - 6 列 x5 行 */}
                    <div className="grid grid-cols-6 gap-1.5 mb-3">
                      {PRESET_COLORS.map((color) => (
                        <motion.button
                          key={color}
                          className="w-7 h-7 md:w-8 md:h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: color }}
                          onClick={() => {
                            setSelectedColor(color);
                            setIsEraserMode(false);
                            setShowColorPicker(false);
                          }}
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {selectedColor === color && (
                            <span className="text-white text-xs drop-shadow-lg">✓</span>
                          )}
                        </motion.button>
                      ))}
                    </div>

                    {/* 分割线 */}
                    <div className="border-t border-gray-200 mb-3" />

                    {/* 自定义颜色选择器 */}
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-gray-500 text-center">或自定义颜色</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={selectedColor}
                          onChange={(e) => {
                            setSelectedColor(e.target.value);
                            setIsEraserMode(false);
                          }}
                          className="w-10 h-10 rounded cursor-pointer border-2 border-gray-300"
                        />
                        <div className="flex-1 text-xs text-gray-500">
                          <p>点击色块</p>
                          <p>选择任意颜色</p>
                        </div>
                        <div
                          className="w-10 h-10 rounded-lg border-2 border-gray-300"
                          style={{ backgroundColor: selectedColor }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 画笔粗细选择器 */}
            <div className="relative">
              <motion.button
                onClick={() => {
                  setShowStrokePicker(!showStrokePicker);
                  setShowColorPicker(false);
                  setShowEraserPicker(false);
                }}
                className={`w-10 h-10 md:w-12 md:h-12 ${toolButtonClass} bg-purple-100/80 flex-col gap-0.5 relative`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="rounded-full bg-purple-400" style={{ width: Math.min(16, selectedStrokeWidth * 1.2), height: Math.min(6, selectedStrokeWidth / 3) }} />
                <div className="text-xs font-bold text-gray-600">{selectedStrokeWidth}</div>
              </motion.button>

              <AnimatePresence>
                {showStrokePicker && (
                  <motion.div
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white/95 backdrop-blur-xl rounded-2xl p-3 shadow-2xl border-4 border-white/60 w-32 z-50"
                    initial={{ scale: 0, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0, opacity: 0, y: 10 }}
                  >
                    <p className="text-xs font-bold text-gray-500 mb-2 text-center">画笔粗细</p>
                    <div className="flex flex-col gap-2">
                      {STROKE_WIDTHS.map(width => (
                        <motion.button
                          key={width}
                          className={`w-full h-10 rounded-lg border-2 flex items-center justify-center ${selectedStrokeWidth === width ? 'border-purple-400 bg-purple-50' : 'border-gray-200'}`}
                          onClick={() => {
                            setSelectedStrokeWidth(width);
                            setIsEraserMode(false);
                            setShowStrokePicker(false);
                          }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div
                            className="rounded-full bg-gradient-to-r from-purple-400 to-blue-400"
                            style={{ width: Math.min(24, width * 1.2), height: Math.min(10, width / 2) }}
                          />
                          {selectedStrokeWidth === width && (
                            <span className="ml-2 text-xs font-bold text-purple-400">✓</span>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 橡皮擦按钮 - 布局与画笔一致 */}
            <div className="relative">
              <motion.button
                onClick={() => {
                  // 点击橡皮擦按钮：切换模式 + 打开面板
                  setIsEraserMode(!isEraserMode);
                  setShowEraserPicker(true);
                  setShowColorPicker(false);
                  setShowStrokePicker(false);
                }}
                className={`w-10 h-10 md:w-12 md:h-12 ${toolButtonClass} ${isEraserMode ? 'bg-pink-400' : 'bg-gray-200/80'} flex-col gap-0.5`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="text-base">🧹</div>
                <div className="text-xs font-bold text-gray-600">{eraserStrokeWidth}</div>
                {/* 橡皮擦启用指示器 */}
                {isEraserMode && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
                )}
              </motion.button>

              <AnimatePresence>
                {showEraserPicker && (
                  <motion.div
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white/95 backdrop-blur-xl rounded-2xl p-3 shadow-2xl border-4 border-white/60 w-32 z-50"
                    initial={{ scale: 0, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0, opacity: 0, y: 10 }}
                  >
                    <p className="text-xs font-bold text-gray-500 mb-2 text-center">橡皮大小</p>
                    <div className="flex flex-col gap-2">
                      {STROKE_WIDTHS.map(width => (
                        <motion.button
                          key={width}
                          className={`w-full h-10 rounded-lg border-2 flex items-center justify-center ${eraserStrokeWidth === width ? 'border-pink-400 bg-pink-50' : 'border-gray-200'}`}
                          onClick={() => {
                            setEraserStrokeWidth(width);
                            setIsEraserMode(true);
                            setShowEraserPicker(false);
                          }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div
                            className="rounded-full bg-gray-300"
                            style={{ width: Math.min(24, width * 1.2), height: Math.min(10, width / 2) }}
                          />
                          {eraserStrokeWidth === width && (
                            <span className="ml-2 text-xs font-bold text-pink-400">✓</span>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 清除全部按钮 */}
            <motion.button
              onClick={clearDrawing}
              className={`w-10 h-10 md:w-12 md:h-12 ${toolButtonClass} bg-gray-300/80 text-lg md:text-xl`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              title="清除全部"
            >
              🗑️
            </motion.button>

            {/* 完成按钮 */}
            <motion.button
              onClick={finishDrawing}
              className="bg-gradient-to-r from-green-400 to-blue-400 text-white font-black px-4 py-2 md:px-6 md:py-3 rounded-full shadow-xl border-4 border-white/60 text-sm md:text-base"
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.95 }}
            >
              画好了！
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // 准备投掷阶段
  if (gamePhase === 'ready') {
    return (
      <div
        className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-sky-300 via-blue-200 to-green-100 touch-none"
        ref={containerRef}
        onPointerMove={handlePlanePointerMove}
        onPointerUp={handlePlanePointerUp}
      >
        <canvas ref={canvasRef} className="absolute inset-0" />

        {/* 顶部导航 */}
        <motion.div
          className="absolute top-2 left-2 right-2 z-50 flex items-center justify-between"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <motion.button
            onClick={handleBack}
            className="bg-white/80 backdrop-blur-xl px-4 py-2 rounded-full shadow-xl font-black text-gray-700 border-4 border-white/60 text-sm md:text-base"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
          >
            ← 返回
          </motion.button>
          <motion.div className="bg-gradient-to-r from-green-400 to-blue-400 backdrop-blur-xl px-4 py-2 rounded-full shadow-2xl border-4 border-white/60">
            <span className="text-base md:text-xl font-black text-white drop-shadow-lg">✈️ 纸飞机</span>
          </motion.div>
          <div className="w-10 md:w-20" />
        </motion.div>

        {/* 提示 */}
        <motion.div
          className="absolute top-16 left-1/2 -translate-x-1/2 text-center z-40 px-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl px-4 py-3 shadow-xl">
            <p className="text-sm md:text-base font-black text-gray-700">
              🖱️ 拖动纸飞机向后拉，然后松开投掷！
            </p>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              拉得越远，飞得越远～
            </p>
          </div>
        </motion.div>

        {/* 纸飞机 */}
        <motion.div
          id="paper-plane"
          className="absolute z-30 cursor-grab active:cursor-grabbing touch-none"
          style={{
            left: planePosition.x,
            top: planePosition.y,
            transform: 'translate(-50%, -50%)',
          }}
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: -10 }}
          onPointerDown={handlePlanePointerDown}
        >
          <div className="relative">
            {/* 纸飞机主体 - 放大版本 */}
            <div className="w-20 h-12 md:w-28 md:h-16 relative">
              <svg viewBox="0 0 64 40" className="w-full h-full drop-shadow-xl">
                <polygon
                  points="64,20 0,0 16,20 0,40"
                  fill="white"
                  stroke="#E0E0E0"
                  strokeWidth="2"
                />
                <polygon
                  points="64,20 16,20 24,20"
                  fill="#E8F4F8"
                />
              </svg>
            </div>

            {/* 拖拽力度指示器 */}
            {isDragging && dragStart && dragCurrent && (
              <motion.div
                className="absolute left-full top-1/2 -translate-y-1/2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-500"
                  style={{
                    width: Math.min(100, Math.sqrt(
                      Math.pow(dragStart.x - dragCurrent.x, 2) +
                      Math.pow(dragStart.y - dragCurrent.y, 2)
                    ) * 0.5) + 'px'
                  }}
                />
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* 静态云朵装饰 - 不闪烁 */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute text-5xl opacity-60" style={{ left: '10%', top: '15%' }}>☁️</div>
          <div className="absolute text-6xl opacity-60" style={{ left: '30%', top: '25%' }}>☁️</div>
          <div className="absolute text-5xl opacity-60" style={{ left: '50%', top: '10%' }}>☁️</div>
          <div className="absolute text-6xl opacity-60" style={{ left: '70%', top: '30%' }}>☁️</div>
          <div className="absolute text-5xl opacity-60" style={{ left: '85%', top: '20%' }}>☁️</div>
        </div>

      </div>
    );
  }

  // 飞行阶段
  if (gamePhase === 'flying') {
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-sky-400 via-blue-300 to-green-200 touch-none">
        {/* 画布显示之前的绘画 */}
        <canvas ref={canvasRef} className="absolute inset-0 opacity-50" />

        {/* 纸飞机 */}
        <motion.div
          id="paper-plane"
          className="absolute z-30"
          style={{
            left: planePosition.x,
            top: planePosition.y,
          }}
        >
          <div className="w-20 h-12 md:w-28 md:h-16 relative">
            <svg viewBox="0 0 64 40" className="w-full h-full drop-shadow-xl">
              <polygon
                points="64,20 0,0 16,20 0,40"
                fill="white"
                stroke="#E0E0E0"
                strokeWidth="2"
              />
              <polygon
                points="64,20 16,20 24,20"
                fill="#E8F4F8"
              />
            </svg>
          </div>
        </motion.div>

        {/* 静态云朵装饰 - 不闪烁 */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute text-5xl opacity-60" style={{ left: '10%', top: '15%' }}>☁️</div>
          <div className="absolute text-6xl opacity-60" style={{ left: '30%', top: '25%' }}>☁️</div>
          <div className="absolute text-5xl opacity-60" style={{ left: '50%', top: '10%' }}>☁️</div>
          <div className="absolute text-6xl opacity-60" style={{ left: '70%', top: '30%' }}>☁️</div>
          <div className="absolute text-5xl opacity-60" style={{ left: '85%', top: '20%' }}>☁️</div>
        </div>
      </div>
    );
  }

  // 结束阶段
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-sky-400 via-blue-300 to-green-200 touch-none">
      {/* 静态云朵装饰 - 不闪烁 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute text-5xl opacity-60" style={{ left: '5%', top: '10%' }}>☁️</div>
        <div className="absolute text-6xl opacity-60" style={{ left: '20%', top: '25%' }}>☁️</div>
        <div className="absolute text-5xl opacity-60" style={{ left: '40%', top: '15%' }}>☁️</div>
        <div className="absolute text-6xl opacity-60" style={{ left: '60%', top: '30%' }}>☁️</div>
        <div className="absolute text-5xl opacity-60" style={{ left: '80%', top: '20%' }}>☁️</div>
        <div className="absolute text-6xl opacity-60" style={{ left: '90%', top: '10%' }}>☁️</div>
      </div>

      {/* 消息显示 */}
      <AnimatePresence>
        {showMessage && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-50 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-2xl max-w-md w-full text-center"
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', bounce: 0.5 }}
            >
              <motion.div
                className="text-6xl md:text-8xl mb-4 md:mb-6"
                animate={{
                  y: [0, -10, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ✈️
              </motion.div>

              <motion.p
                className="text-base md:text-xl font-black text-gray-700 mb-6 md:mb-8 leading-relaxed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {currentMessage}
              </motion.p>

              <div className="flex gap-3 md:gap-4">
                <motion.button
                  onClick={handleRestart}
                  className="flex-1 bg-gradient-to-r from-green-400 to-blue-400 text-white font-black py-3 md:py-4 rounded-full shadow-xl text-sm md:text-base"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  再来一次
                </motion.button>
                <motion.button
                  onClick={handleBack}
                  className="flex-1 bg-gray-300 text-gray-700 font-black py-3 md:py-4 rounded-full shadow-xl text-sm md:text-base"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  返回游乐场
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
