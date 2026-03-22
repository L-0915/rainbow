import { useState, useMemo, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { useEmotionStore, EMOTION_CONFIG, type EmotionType, type EmotionRecord } from '@/store/emotionStore';
import { useAchievementStore } from '@/store/appStore';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ReportExportProps {
  childName?: string;
  onClose?: () => void;
}

export const ReportExport = memo(({ childName = '小宝贝', onClose }: ReportExportProps) => {
  const history = useEmotionStore((state) => state.history);
  const achievements = useAchievementStore((state) => state.achievements);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [exportType, setExportType] = useState<'week' | 'month'>('week');

  // 获取报告数据
  const reportData = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    if (exportType === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const filteredHistory = history.filter(r => new Date(r.date) >= startDate);

    // 统计
    const emotionCounts: Record<EmotionType, number> = {
      happy: 0, calm: 0, angry: 0, scared: 0, sad: 0, excited: 0,
    };
    filteredHistory.forEach(r => { emotionCounts[r.emotion]++; });

    const totalDays = filteredHistory.length;
    const positiveCount = emotionCounts.happy + emotionCounts.excited + emotionCounts.calm;
    const positiveRatio = totalDays > 0 ? (positiveCount / totalDays) * 100 : 0;

    // 已解锁成就
    const unlockedAchievements = Object.values(achievements).filter(a => a.unlocked);

    return {
      totalDays,
      emotionCounts,
      positiveRatio,
      unlockedAchievements,
      dateRange: `${startDate.toLocaleDateString('zh-CN')} - ${now.toLocaleDateString('zh-CN')}`,
    };
  }, [history, achievements, exportType]);

  // 导出为图片
  const handleExportImage = useCallback(async () => {
    setIsExportingImage(true);

    try {
      // 创建 Canvas
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 1200;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('无法创建画布');

      // 背景
      const gradient = ctx.createLinearGradient(0, 0, 800, 1200);
      gradient.addColorStop(0, '#FEF3C7');
      gradient.addColorStop(0.5, '#FECACA');
      gradient.addColorStop(1, '#E9D5FF');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 800, 1200);

      // 标题
      ctx.fillStyle = '#1F2937';
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('🌈 彩虹创口贴情绪报告', 400, 60);

      ctx.font = '20px Arial';
      ctx.fillStyle = '#6B7280';
      ctx.fillText(childName, 400, 100);
      ctx.fillText(reportData.dateRange, 400, 130);

      // 记录天数
      ctx.fillStyle = '#7C3AED';
      ctx.font = 'bold 48px Arial';
      ctx.fillText(`${reportData.totalDays} 天`, 400, 200);
      ctx.font = '20px Arial';
      ctx.fillStyle = '#6B7280';
      ctx.fillText('情绪记录', 400, 235);

      // 积极情绪比例
      ctx.fillStyle = '#059669';
      ctx.font = 'bold 48px Arial';
      ctx.fillText(`${reportData.positiveRatio.toFixed(0)}%`, 400, 310);
      ctx.font = '20px Arial';
      ctx.fillStyle = '#6B7280';
      ctx.fillText('积极情绪', 400, 345);

      // 情绪分布
      ctx.font = 'bold 28px Arial';
      ctx.fillStyle = '#1F2937';
      ctx.textAlign = 'left';
      ctx.fillText('📊 情绪分布', 50, 420);

      const emotions = Object.entries(reportData.emotionCounts) as [EmotionType, number][];
      let yPos = 460;
      emotions.filter(([_, count]) => count > 0).forEach(([emotion, count]) => {
        const config = EMOTION_CONFIG[emotion];
        ctx.font = '24px Arial';
        ctx.fillText(`${config.emoji} ${config.label}`, 70, yPos);
        ctx.fillStyle = config.color;
        ctx.fillRect(250, yPos - 20, (count / reportData.totalDays) * 400, 30);
        ctx.fillStyle = '#1F2937';
        ctx.font = '20px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`${count} 天`, 700, yPos);
        ctx.textAlign = 'left';
        yPos += 50;
      });

      // 成就展示
      ctx.font = 'bold 28px Arial';
      ctx.fillStyle = '#1F2937';
      ctx.fillText('🏆 已解锁成就', 50, yPos + 40);

      yPos += 80;
      reportData.unlockedAchievements.slice(0, 4).forEach((achievement) => {
        ctx.font = '24px Arial';
        ctx.fillText(`${achievement.emoji} ${achievement.title}`, 70, yPos);
        ctx.font = '16px Arial';
        ctx.fillStyle = '#6B7280';
        ctx.fillText(achievement.description, 70, yPos + 25);
        ctx.fillStyle = '#1F2937';
        yPos += 60;
      });

      // 底部
      ctx.textAlign = 'center';
      ctx.font = '16px Arial';
      ctx.fillStyle = '#9CA3AF';
      ctx.fillText('由彩虹创口贴生成', 400, 1150);
      ctx.fillText(new Date().toLocaleDateString('zh-CN'), 400, 1175);

      // 下载图片
      const link = document.createElement('a');
      link.download = `彩虹创口贴-${childName}情绪报告-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试');
    } finally {
      setIsExportingImage(false);
    }
  }, [childName, reportData]);

  // 导出为 PDF
  const handleExportPDF = useCallback(async () => {
    setIsExportingPDF(true);

    try {
      // 创建一个隐藏的 div 用于渲染 PDF 内容
      const pdfContainer = document.createElement('div');
      pdfContainer.style.position = 'absolute';
      pdfContainer.style.left = '-9999px';
      pdfContainer.style.width = '800px';
      pdfContainer.style.padding = '40px';
      pdfContainer.style.background = 'linear-gradient(135deg, #FEF3C7 0%, #FECACA 50%, #E9D5FF 100%)';
      pdfContainer.style.fontFamily = 'Arial, sans-serif';

      // 构建 HTML 内容
      pdfContainer.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1F2937; font-size: 32px; margin: 0;">🌈 彩虹创口贴情绪报告</h1>
          <p style="color: #6B7280; font-size: 18px; margin: 10px 0;">${childName}</p>
          <p style="color: #6B7280; font-size: 16px;">${reportData.dateRange}</p>
        </div>

        <div style="display: flex; justify-content: space-around; margin-bottom: 40px;">
          <div style="text-align: center; background: white; padding: 20px; border-radius: 12px; flex: 1; margin: 0 10px;">
            <p style="color: #7C3AED; font-size: 42px; font-weight: bold; margin: 0;">${reportData.totalDays}</p>
            <p style="color: #6B7280; font-size: 16px; margin: 10px 0 0 0;">情绪记录</p>
          </div>
          <div style="text-align: center; background: white; padding: 20px; border-radius: 12px; flex: 1; margin: 0 10px;">
            <p style="color: #059669; font-size: 42px; font-weight: bold; margin: 0;">${reportData.positiveRatio.toFixed(0)}%</p>
            <p style="color: #6B7280; font-size: 16px; margin: 10px 0 0 0;">积极情绪</p>
          </div>
        </div>

        <div style="background: white; padding: 25px; border-radius: 12px; margin-bottom: 30px;">
          <h2 style="color: #1F2937; font-size: 24px; margin: 0 0 20px 0;">📊 情绪分布</h2>
          ${Object.entries(reportData.emotionCounts)
            .filter(([_, count]) => count > 0)
            .map(([emotion, count]) => {
              const config = EMOTION_CONFIG[emotion as EmotionType];
              const percentage = (count / reportData.totalDays) * 100;
              return `
                <div style="margin-bottom: 15px;">
                  <div style="display: flex; align-items: center; margin-bottom: 5px;">
                    <span style="font-size: 20px; margin-right: 10px;">${config.emoji}</span>
                    <span style="color: #374151; font-weight: bold;">${config.label}</span>
                    <span style="color: #6B7280; margin-left: auto;">${count} 天</span>
                  </div>
                  <div style="background: #E5E7EB; height: 20px; border-radius: 10px; overflow: hidden;">
                    <div style="background: ${config.color}; width: ${percentage}%; height: 100%;"></div>
                  </div>
                </div>
              `;
            })
            .join('')}
        </div>

        <div style="background: white; padding: 25px; border-radius: 12px; margin-bottom: 30px;">
          <h2 style="color: #1F2937; font-size: 24px; margin: 0 0 20px 0;">🏆 已解锁成就</h2>
          ${reportData.unlockedAchievements.slice(0, 6).map(achievement => `
            <div style="margin-bottom: 15px; padding: 12px; background: #F9FAFB; border-radius: 8px;">
              <div style="display: flex; align-items: center;">
                <span style="font-size: 24px; margin-right: 12px;">${achievement.emoji}</span>
                <div>
                  <p style="color: #1F2937; font-weight: bold; margin: 0;">${achievement.title}</p>
                  <p style="color: #6B7280; font-size: 14px; margin: 5px 0 0 0;">${achievement.description}</p>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
          <p style="color: #9CA3AF; font-size: 14px; margin: 5px 0;">由彩虹创口贴生成</p>
          <p style="color: #9CA3AF; font-size: 14px; margin: 5px 0;">${new Date().toLocaleDateString('zh-CN')}</p>
        </div>
      `;

      document.body.appendChild(pdfContainer);

      // 使用 html2canvas 将 HTML 转换为 canvas
      const canvas = await html2canvas(pdfContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      // 清理临时容器
      document.body.removeChild(pdfContainer);

      // 创建 PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      // 下载 PDF
      pdf.save(`彩虹创口贴-${childName}情绪报告-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('导出 PDF 失败:', error);
      alert('导出 PDF 失败，请重试');
    } finally {
      setIsExportingPDF(false);
    }
  }, [childName, reportData]);

  // 分享功能
  const handleShare = useCallback(async () => {
    const shareText = `🌈 ${childName}的情绪报告\n\n` +
      `📅 记录天数：${reportData.totalDays} 天\n` +
      `✨ 积极情绪：${reportData.positiveRatio.toFixed(0)}%\n` +
      `🏆 已解锁成就：${reportData.unlockedAchievements.length} 个\n\n` +
      `来自彩虹创口贴`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: '彩虹创口贴情绪报告',
          text: shareText,
        });
      } catch (error) {
        console.log('分享取消');
      }
    } else {
      // 复制到剪贴板
      navigator.clipboard.writeText(shareText);
      alert('报告已复制到剪贴板');
    }
  }, [childName, reportData]);

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-4 shadow-lg">
      {/* 标题 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📤</span>
          <h3 className="font-bold text-gray-700">导出情绪报告</h3>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-400">✕</button>
        )}
      </div>

      {/* 时间范围选择 */}
      <div className="flex gap-2 mb-4">
        <motion.button
          onClick={() => setExportType('week')}
          className={`flex-1 py-2 rounded-xl font-bold text-sm ${
            exportType === 'week'
              ? 'bg-purple-500 text-white'
              : 'bg-gray-100 text-gray-600'
          }`}
          whileTap={{ scale: 0.95 }}
        >
          本周
        </motion.button>
        <motion.button
          onClick={() => setExportType('month')}
          className={`flex-1 py-2 rounded-xl font-bold text-sm ${
            exportType === 'month'
              ? 'bg-purple-500 text-white'
              : 'bg-gray-100 text-gray-600'
          }`}
          whileTap={{ scale: 0.95 }}
        >
          本月
        </motion.button>
      </div>

      {/* 报告预览 */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 mb-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <p className="text-2xl font-black text-purple-600">{reportData.totalDays}</p>
            <p className="text-xs text-gray-500">记录天数</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-green-600">{reportData.positiveRatio.toFixed(0)}%</p>
            <p className="text-xs text-gray-500">积极情绪</p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-lg font-bold text-gray-600">🏆 已解锁 {reportData.unlockedAchievements.length} 个成就</p>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="space-y-2">
        <motion.button
          onClick={handleExportImage}
          disabled={isExportingImage || reportData.totalDays === 0}
          className="w-full bg-gradient-to-r from-purple-400 to-pink-400 text-white font-bold py-3 rounded-xl disabled:opacity-50"
          whileTap={{ scale: 0.95 }}
        >
          {isExportingImage ? '导出中...' : '📥 导出为图片'}
        </motion.button>

        <motion.button
          onClick={handleExportPDF}
          disabled={isExportingPDF || reportData.totalDays === 0}
          className="w-full bg-gradient-to-r from-red-400 to-orange-400 text-white font-bold py-3 rounded-xl disabled:opacity-50"
          whileTap={{ scale: 0.95 }}
        >
          {isExportingPDF ? '导出中...' : '📄 导出为 PDF'}
        </motion.button>

        <motion.button
          onClick={handleShare}
          disabled={reportData.totalDays === 0}
          className="w-full bg-blue-100 text-blue-600 font-bold py-3 rounded-xl disabled:opacity-50"
          whileTap={{ scale: 0.95 }}
        >
          📤 分享报告
        </motion.button>
      </div>

      {reportData.totalDays === 0 && (
        <p className="text-center text-gray-400 text-sm mt-2">
          暂无数据可导出，记录心情后再试
        </p>
      )}
    </div>
  );
});

ReportExport.displayName = 'ReportExport';