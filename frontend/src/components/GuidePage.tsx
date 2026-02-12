import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const GuidePage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('intro');
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  const sections = [
    { id: 'intro', title: '一、平台简介' },
    { id: 'admin', title: '二、管理员操作指南' },
    { id: 'moderator', title: '三、版主操作指南' },
    { id: 'user', title: '四、普通用户操作指南' },
    { id: 'faq', title: '五、常见问题（FAQ）' },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-20% 0px -60% 0px', // Trigger when section is near top
        threshold: 0.1
      }
    );

    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const element = sectionRefs.current[id];
    if (element) {
      const yOffset = -100; // Offset for sticky header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveSection(id);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 relative pb-12">
      {/* Sidebar - Table of Contents */}
      <aside className="hidden md:block w-64 flex-shrink-0">
        <div className="sticky top-24 glass p-4 rounded-xl">
          <h3 className="font-bold text-white mb-4 px-2 text-lg border-b border-white/10 pb-2">目录</h3>
          <nav>
            <ul className="space-y-1">
              {sections.map((section) => (
                <li key={section.id}>
                  <button
                    onClick={() => scrollToSection(section.id)}
                    className={`text-left w-full px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                      activeSection === section.id
                        ? 'bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {section.title}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 space-y-12">
        <h1 className="text-3xl font-bold text-gradient-primary mb-8 md:hidden">操作手册 & 使用指南</h1>

        {/* Chapter 1: Platform Introduction */}
        <section
          id="intro"
          ref={(el) => (sectionRefs.current['intro'] = el)}
          className="glass p-8 rounded-2xl scroll-mt-24"
        >
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">01</span>
            平台简介
          </h2>
          <div className="space-y-4 text-gray-300">
            <p className="leading-relaxed">
              本平台是一个专为内部文档管理与查重设计的智能检测系统。它旨在帮助团队高效地维护文档原创性，防止内容重复，并确保知识资产的规范管理。
            </p>
            <div className="bg-blue-500/10 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg">
              <p className="font-medium text-blue-300">平台设有三种核心角色：</p>
              <ul className="mt-2 space-y-1 text-gray-300 list-disc list-inside">
                <li><strong className="text-white">管理员</strong>：负责系统配置、用户账号管理与全局监控。</li>
                <li><strong className="text-white">版主</strong>：负责构建文档库（“档案柜”），上传并维护作为对比源的历史文档。</li>
                <li><strong className="text-white">普通用户</strong>：主要进行日常的文档查重操作，查看比对报告。</li>
              </ul>
            </div>
            <p className="text-gray-400 italic">
              💡 提示：如果您是普通用户，请直接跳转阅读 <button onClick={() => scrollToSection('user')} className="text-indigo-400 underline hover:text-indigo-300">第四章：普通用户操作指南</button> 以快速上手。
            </p>
          </div>
        </section>

        {/* Chapter 2: Admin Guide */}
        <section
          id="admin"
          ref={(el) => (sectionRefs.current['admin'] = el)}
          className="glass p-8 rounded-2xl scroll-mt-24"
        >
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">02</span>
            管理员操作指南
          </h2>
          <div className="space-y-6 text-gray-300">
            <div className="bg-white/5 p-5 rounded-lg border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-2">2.1 登录系统</h3>
              <p>使用系统分发的超级管理员账号进行登录。管理员拥有最高权限，请妥善保管账号密码。</p>
            </div>

            <div className="bg-white/5 p-5 rounded-lg border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-2">2.2 用户管理</h3>
              <p className="mb-2">进入“用户管理”界面，您可以执行以下操作：</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong className="text-gray-200">创建用户</strong>：填写邮箱、初始密码并指定角色（版主/普通用户）。</li>
                <li><strong className="text-gray-200">修改角色</strong>：根据业务需求调整现有用户的权限级别。</li>
                <li><strong className="text-gray-200">账号控制</strong>：对违规或离职人员的账号进行“禁用”或“启用”操作。</li>
              </ul>
            </div>

            <div className="bg-white/5 p-5 rounded-lg border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-2">2.3 系统概览</h3>
              <p>仪表盘（Dashboard）为您展示系统运行的核心数据，包括注册用户总数、文档库数量、当日查重请求量等统计信息，帮助您掌握平台负载情况。</p>
            </div>
          </div>
        </section>

        {/* Chapter 3: Moderator Guide */}
        <section
          id="moderator"
          ref={(el) => (sectionRefs.current['moderator'] = el)}
          className="glass p-8 rounded-2xl scroll-mt-24"
        >
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">03</span>
            版主操作指南
          </h2>
          <div className="space-y-6 text-gray-300">
            <div>
              <h3 className="text-xl font-semibold text-white mb-3 border-l-4 border-indigo-500 pl-3">3.1 创建文档库</h3>
              <p className="mb-2">文档库是系统的核心对比源，您可以将其想象为现实中的<strong>“档案柜”</strong>。查重操作就是将新文件与这些“档案柜”里的文件进行比对。</p>
              <div className="bg-yellow-500/10 text-yellow-200 border border-yellow-500/20 p-3 rounded text-sm">
                <strong>命名建议：</strong> 建议按年份或项目维度命名，例如“2023年度技术报告”、“XX项目验收材料”，以便于分类管理。
              </div>
            </div>

            <div className="border-t border-white/10 pt-6">
              <h3 className="text-xl font-semibold text-white mb-3 border-l-4 border-indigo-500 pl-3">3.2 上传历史文档</h3>
              <p className="mb-3">创建文档库后，需要向其中填充数据。支持批量上传文件。</p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <li className="bg-white/5 p-3 rounded flex items-center">
                  <span className="text-indigo-400 mr-2">✓</span> 支持 PDF / Word / TXT
                </li>
                <li className="bg-white/5 p-3 rounded flex items-center">
                  <span className="text-indigo-400 mr-2">✓</span> 支持 图片格式 (OCR识别)
                </li>
              </ul>
              <p className="text-sm">
                <strong>状态流转：</strong> 上传后文件状态为 <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded text-xs ml-1">处理中</span>，系统解析完成后变为 <span className="px-2 py-0.5 bg-green-500/20 text-green-300 rounded text-xs ml-1">就绪</span>。若解析出错则显示 <span className="px-2 py-0.5 bg-red-500/20 text-red-300 rounded text-xs ml-1">失败</span>。
              </p>
            </div>

            <div className="border-t border-white/10 pt-6">
              <h3 className="text-xl font-semibold text-white mb-3 border-l-4 border-indigo-500 pl-3">3.3 管理文档库</h3>
              <p>您可以随时进入文档库查看已索引的文件列表。对于不再需要的旧文档库，可以进行“停用”操作（软删除），停用后普通用户在查重时将无法选择该库。</p>
            </div>
          </div>
        </section>

        {/* Chapter 4: User Guide */}
        <section
          id="user"
          ref={(el) => (sectionRefs.current['user'] = el)}
          className="glass p-8 rounded-2xl scroll-mt-24 ring-2 ring-indigo-500/20"
        >
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <span className="bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm shadow-lg shadow-indigo-500/30">04</span>
            普通用户操作指南
          </h2>

          <div className="space-y-8 text-gray-300">
            {/* 4.1 */}
            <div>
              <h3 className="text-lg font-bold text-white mb-2">4.1 登录系统</h3>
              <p>您的账号由管理员统一创建并分发，系统暂不支持自行注册。首次登录建议修改默认密码。</p>
            </div>

            {/* 4.2 */}
            <div className="bg-gradient-to-br from-indigo-900/30 to-transparent p-6 rounded-xl border border-indigo-500/20">
              <h3 className="text-lg font-bold text-white mb-4">4.2 提交查重检测 (核心流程)</h3>
              <div className="flex flex-col md:flex-row justify-between relative">
                {/* Step 1 */}
                <div className="flex-1 text-center relative z-10 mb-4 md:mb-0">
                  <div className="w-10 h-10 bg-surface border-2 border-indigo-500 text-indigo-400 rounded-full flex items-center justify-center mx-auto font-bold mb-2 shadow-sm">1</div>
                  <h4 className="font-medium text-white">进入检测页</h4>
                  <p className="text-xs text-gray-400 mt-1">点击导航栏<br/>“查重检测”</p>
                </div>
                {/* Connector Line */}
                <div className="hidden md:block absolute top-5 left-0 w-full h-0.5 bg-indigo-500/30 -z-0"></div>

                {/* Step 2 */}
                <div className="flex-1 text-center relative z-10 mb-4 md:mb-0">
                  <div className="w-10 h-10 bg-surface border-2 border-indigo-500 text-indigo-400 rounded-full flex items-center justify-center mx-auto font-bold mb-2 shadow-sm">2</div>
                  <h4 className="font-medium text-white">选择范围</h4>
                  <p className="text-xs text-gray-400 mt-1">勾选需要比对的<br/>“文档库”</p>
                </div>

                {/* Step 3 */}
                <div className="flex-1 text-center relative z-10 mb-4 md:mb-0">
                  <div className="w-10 h-10 bg-surface border-2 border-indigo-500 text-indigo-400 rounded-full flex items-center justify-center mx-auto font-bold mb-2 shadow-sm">3</div>
                  <h4 className="font-medium text-white">上传文件</h4>
                  <p className="text-xs text-gray-400 mt-1">拖拽或点击上传<br/>待测文档</p>
                </div>

                {/* Step 4 */}
                <div className="flex-1 text-center relative z-10">
                  <div className="w-10 h-10 bg-indigo-600 border-2 border-indigo-600 text-white rounded-full flex items-center justify-center mx-auto font-bold mb-2 shadow-md">4</div>
                  <h4 className="font-medium text-white">开始检测</h4>
                  <p className="text-xs text-gray-400 mt-1">系统自动分析<br/>生成报告</p>
                </div>
              </div>
            </div>

            {/* 4.3 */}
            <div>
              <h3 className="text-lg font-bold text-white mb-3">4.3 查看检测报告</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-1.5 h-1.5 mt-2 bg-gray-500 rounded-full mr-2"></span>
                  <p><strong className="text-gray-200">结果列表：</strong> 在检测历史页面，您可以看到所有批次的查重记录。</p>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-1.5 h-1.5 mt-2 bg-gray-500 rounded-full mr-2"></span>
                  <p><strong className="text-gray-200">相似度指标：</strong> 关注总相似度百分比。点击“查看详情”进入报告页。</p>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-1.5 h-1.5 mt-2 bg-gray-500 rounded-full mr-2"></span>
                  <div>
                    <strong className="text-gray-200">详情解读：</strong> 系统会列出每一处重复的来源，例如：
                    <code className="bg-white/10 text-indigo-300 px-2 py-0.5 rounded text-sm mx-1">[2024年度项目材料] 某报告.docx</code>
                    并在下方展示具体的重复段落对比，高亮相同文字。
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Chapter 5: FAQ */}
        <section
          id="faq"
          ref={(el) => (sectionRefs.current['faq'] = el)}
          className="glass p-8 rounded-2xl scroll-mt-24"
        >
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">05</span>
            常见问题（FAQ）
          </h2>
          <div className="grid grid-cols-1 gap-6">
            {[
              { q: '上传后显示“处理中”很久怎么办？', a: '系统需要提取文档文本并建立倒排索引，大文件或图片PDF可能耗时较长（1-3分钟），请耐心等待或尝试刷新页面。' },
              { q: '为什么检测结果显示 0% 相似度？', a: '这说明您的文档与您勾选的“文档库”中的内容没有任何重复，或者您选择的文档库本身是空的。' },
              { q: '支持哪些文件格式？', a: '目前支持常见的 .pdf, .docx, .doc, .txt 文本文件，以及包含文字的图片格式（jpg, png）。' },
              { q: '一次最多能上传多少文件？', a: '为了保证服务器性能和响应速度，建议单次批量检测不超过 10 个文件。' },
              { q: '如何联系管理员？', a: '如遇账号无法登录、权限错误或系统故障，请直接联系公司 IT 部门或发送邮件至技术支持邮箱。' },
            ].map((item, idx) => (
              <div key={idx} className="bg-white/5 rounded-lg p-5 hover:bg-white/10 transition-colors border border-white/5">
                <h4 className="font-bold text-white mb-2 flex items-start">
                  <span className="text-indigo-400 mr-2">Q:</span>
                  {item.q}
                </h4>
                <p className="text-gray-400 pl-6 text-sm leading-relaxed border-l-2 border-indigo-500/30">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm pt-8 pb-4">
          &copy; {new Date().getFullYear()} Plagiarism Detection Platform. Internal Use Only.
        </div>
      </main>
    </div>
  );
};

export default GuidePage;
