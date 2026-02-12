import React, { useState, useEffect, useRef } from 'react';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', position: 'relative', paddingBottom: '48px', maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
      <div style={{ display: 'flex', flexDirection: 'row', gap: '32px' }}>
      {/* Sidebar - Table of Contents */}
      <aside className="hidden md:block" style={{ width: '256px', flexShrink: 0 }}>
        <div className="glass" style={{ position: 'sticky', top: '96px', padding: '16px', borderRadius: '12px' }}>
          <h3 style={{ fontWeight: 700, color: 'white', marginBottom: '16px', padding: '0 8px', fontSize: '1.125rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>目录</h3>
          <nav>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {sections.map((section) => (
                <li key={section.id}>
                  <button
                    onClick={() => scrollToSection(section.id)}
                    style={{
                      textAlign: 'left',
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      transition: 'all 200ms',
                      background: activeSection === section.id ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                      color: activeSection === section.id ? '#a5b4fc' : '#9ca3af',
                      fontWeight: activeSection === section.id ? 600 : 400,
                      border: activeSection === section.id ? '1px solid rgba(99, 102, 241, 0.3)' : 'none',
                      cursor: 'pointer'
                    }}
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
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '48px' }}>
        <h1 className="text-gradient-primary md:hidden" style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '32px' }}>操作手册 & 使用指南</h1>

        {/* Chapter 1: Platform Introduction */}
        <section
          id="intro"
          ref={(el) => (sectionRefs.current['intro'] = el)}
          className="glass"
          style={{ padding: '32px', borderRadius: '16px', scrollMarginTop: '96px' }}
        >
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', marginBottom: '24px', display: 'flex', alignItems: 'center' }}>
            <span style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.3)', width: '32px', height: '32px', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px', fontSize: '0.875rem' }}>01</span>
            平台简介
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', color: '#d1d5db' }}>
            <p style={{ lineHeight: 1.625 }}>
              本平台是一个专为内部文档管理与查重设计的智能检测系统。它旨在帮助团队高效地维护文档原创性，防止内容重复，并确保知识资产的规范管理。
            </p>
            <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', borderLeft: '4px solid #3b82f6', padding: '16px', margin: '16px 0', borderRadius: '0 8px 8px 0' }}>
              <p style={{ fontWeight: 500, color: '#93c5fd' }}>平台设有三种核心角色：</p>
              <ul style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px', color: '#d1d5db', listStyleType: 'disc', listStylePosition: 'inside' }}>
                <li><strong style={{ color: 'white' }}>管理员</strong>：负责系统配置、用户账号管理与全局监控。</li>
                <li><strong style={{ color: 'white' }}>版主</strong>：负责构建文档库（“档案柜”），上传并维护作为对比源的历史文档。</li>
                <li><strong style={{ color: 'white' }}>普通用户</strong>：主要进行日常的文档查重操作，查看比对报告。</li>
              </ul>
            </div>
            <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>
              💡 提示：如果您是普通用户，请直接跳转阅读 <button onClick={() => scrollToSection('user')} style={{ color: '#818cf8', textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', padding: 0, font: 'inherit' }}>第四章：普通用户操作指南</button> 以快速上手。
            </p>
          </div>
        </section>

        {/* Chapter 2: Admin Guide */}
        <section
          id="admin"
          ref={(el) => (sectionRefs.current['admin'] = el)}
          className="glass"
          style={{ padding: '32px', borderRadius: '16px', scrollMarginTop: '96px' }}
        >
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', marginBottom: '24px', display: 'flex', alignItems: 'center' }}>
            <span style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.3)', width: '32px', height: '32px', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px', fontSize: '0.875rem' }}>02</span>
            管理员操作指南
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', color: '#d1d5db' }}>
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '20px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'white', marginBottom: '8px' }}>2.1 登录系统</h3>
              <p>使用系统分发的超级管理员账号进行登录。管理员拥有最高权限，请妥善保管账号密码。</p>
            </div>

            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '20px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'white', marginBottom: '8px' }}>2.2 用户管理</h3>
              <p style={{ marginBottom: '8px' }}>进入“用户管理”界面，您可以执行以下操作：</p>
              <ul style={{ listStyleType: 'disc', listStylePosition: 'inside', display: 'flex', flexDirection: 'column', gap: '4px', marginLeft: '8px' }}>
                <li><strong style={{ color: '#e5e7eb' }}>创建用户</strong>：填写邮箱、初始密码并指定角色（版主/普通用户）。</li>
                <li><strong style={{ color: '#e5e7eb' }}>修改角色</strong>：根据业务需求调整现有用户的权限级别。</li>
                <li><strong style={{ color: '#e5e7eb' }}>账号控制</strong>：对违规或离职人员的账号进行“禁用”或“启用”操作。</li>
              </ul>
            </div>

            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '20px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'white', marginBottom: '8px' }}>2.3 系统概览</h3>
              <p>仪表盘（Dashboard）为您展示系统运行的核心数据，包括注册用户总数、文档库数量、当日查重请求量等统计信息，帮助您掌握平台负载情况。</p>
            </div>
          </div>
        </section>

        {/* Chapter 3: Moderator Guide */}
        <section
          id="moderator"
          ref={(el) => (sectionRefs.current['moderator'] = el)}
          className="glass"
          style={{ padding: '32px', borderRadius: '16px', scrollMarginTop: '96px' }}
        >
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', marginBottom: '24px', display: 'flex', alignItems: 'center' }}>
            <span style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.3)', width: '32px', height: '32px', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px', fontSize: '0.875rem' }}>03</span>
            版主操作指南
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', color: '#d1d5db' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'white', marginBottom: '12px', borderLeft: '4px solid #6366f1', paddingLeft: '12px' }}>3.1 创建文档库</h3>
              <p style={{ marginBottom: '8px' }}>文档库是系统的核心对比源，您可以将其想象为现实中的<strong>“档案柜”</strong>。查重操作就是将新文件与这些“档案柜”里的文件进行比对。</p>
              <div style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#fef08a', border: '1px solid rgba(234, 179, 8, 0.2)', padding: '12px', borderRadius: '4px', fontSize: '0.875rem' }}>
                <strong>命名建议：</strong> 建议按年份或项目维度命名，例如“2023年度技术报告”、“XX项目验收材料”，以便于分类管理。
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'white', marginBottom: '12px', borderLeft: '4px solid #6366f1', paddingLeft: '12px' }}>3.2 上传历史文档</h3>
              <p style={{ marginBottom: '12px' }}>创建文档库后，需要向其中填充数据。支持批量上传文件。</p>
              <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <li style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ color: '#818cf8', marginRight: '8px' }}>✓</span> 支持 PDF / Word / TXT
                </li>
                <li style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ color: '#818cf8', marginRight: '8px' }}>✓</span> 支持 图片格式 (OCR识别)
                </li>
              </ul>
              <p style={{ fontSize: '0.875rem' }}>
                <strong>状态流转：</strong> 上传后文件状态为 <span style={{ padding: '2px 8px', backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd', borderRadius: '4px', fontSize: '0.75rem', marginLeft: '4px' }}>处理中</span>，系统解析完成后变为 <span style={{ padding: '2px 8px', backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#86efac', borderRadius: '4px', fontSize: '0.75rem', marginLeft: '4px' }}>就绪</span>。若解析出错则显示 <span style={{ padding: '2px 8px', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', borderRadius: '4px', fontSize: '0.75rem', marginLeft: '4px' }}>失败</span>。
              </p>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'white', marginBottom: '12px', borderLeft: '4px solid #6366f1', paddingLeft: '12px' }}>3.3 管理文档库</h3>
              <p>您可以随时进入文档库查看已索引的文件列表。对于不再需要的旧文档库，可以进行“停用”操作（软删除），停用后普通用户在查重时将无法选择该库。</p>
            </div>
          </div>
        </section>

        {/* Chapter 4: User Guide */}
        <section
          id="user"
          ref={(el) => (sectionRefs.current['user'] = el)}
          className="glass"
          style={{ padding: '32px', borderRadius: '16px', scrollMarginTop: '96px', boxShadow: '0 0 0 2px rgba(99, 102, 241, 0.2)' }}
        >
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', marginBottom: '24px', display: 'flex', alignItems: 'center' }}>
            <span style={{ backgroundColor: '#4f46e5', color: 'white', width: '32px', height: '32px', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px', fontSize: '0.875rem', boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)' }}>04</span>
            普通用户操作指南
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', color: '#d1d5db' }}>
            {/* 4.1 */}
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'white', marginBottom: '8px' }}>4.1 登录系统</h3>
              <p>您的账号由管理员统一创建并分发，系统暂不支持自行注册。首次登录建议修改默认密码。</p>
            </div>

            {/* 4.2 */}
            <div style={{ background: 'linear-gradient(to bottom right, rgba(49, 46, 129, 0.3), transparent)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'white', marginBottom: '16px' }}>4.2 提交查重检测 (核心流程)</h3>
              <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', position: 'relative', flexWrap: 'wrap', gap: '16px' }}>
                {/* Step 1 */}
                <div style={{ flex: 1, textAlign: 'center', position: 'relative', zIndex: 10, minWidth: '120px' }}>
                  <div style={{ width: '40px', height: '40px', backgroundColor: '#111827', border: '2px solid #6366f1', color: '#818cf8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px auto', fontWeight: 700, boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>1</div>
                  <h4 style={{ fontWeight: 500, color: 'white' }}>进入检测页</h4>
                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px' }}>点击导航栏<br/>“查重检测”</p>
                </div>

                {/* Step 2 */}
                <div style={{ flex: 1, textAlign: 'center', position: 'relative', zIndex: 10, minWidth: '120px' }}>
                  <div style={{ width: '40px', height: '40px', backgroundColor: '#111827', border: '2px solid #6366f1', color: '#818cf8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px auto', fontWeight: 700, boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>2</div>
                  <h4 style={{ fontWeight: 500, color: 'white' }}>选择范围</h4>
                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px' }}>勾选需要比对的<br/>“文档库”</p>
                </div>

                {/* Step 3 */}
                <div style={{ flex: 1, textAlign: 'center', position: 'relative', zIndex: 10, minWidth: '120px' }}>
                  <div style={{ width: '40px', height: '40px', backgroundColor: '#111827', border: '2px solid #6366f1', color: '#818cf8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px auto', fontWeight: 700, boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>3</div>
                  <h4 style={{ fontWeight: 500, color: 'white' }}>上传文件</h4>
                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px' }}>拖拽或点击上传<br/>待测文档</p>
                </div>

                {/* Step 4 */}
                <div style={{ flex: 1, textAlign: 'center', position: 'relative', zIndex: 10, minWidth: '120px' }}>
                  <div style={{ width: '40px', height: '40px', backgroundColor: '#4f46e5', border: '2px solid #4f46e5', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px auto', fontWeight: 700, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>4</div>
                  <h4 style={{ fontWeight: 500, color: 'white' }}>开始检测</h4>
                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px' }}>系统自动分析<br/>生成报告</p>
                </div>
              </div>
            </div>

            {/* 4.3 */}
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'white', marginBottom: '12px' }}>4.3 查看检测报告</h3>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <span style={{ flexShrink: 0, width: '6px', height: '6px', marginTop: '8px', backgroundColor: '#6b7280', borderRadius: '50%', marginRight: '8px' }}></span>
                  <p><strong style={{ color: '#e5e7eb' }}>结果列表：</strong> 在检测历史页面，您可以看到所有批次的查重记录。</p>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <span style={{ flexShrink: 0, width: '6px', height: '6px', marginTop: '8px', backgroundColor: '#6b7280', borderRadius: '50%', marginRight: '8px' }}></span>
                  <p><strong style={{ color: '#e5e7eb' }}>相似度指标：</strong> 关注总相似度百分比。点击“查看详情”进入报告页。</p>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <span style={{ flexShrink: 0, width: '6px', height: '6px', marginTop: '8px', backgroundColor: '#6b7280', borderRadius: '50%', marginRight: '8px' }}></span>
                  <div>
                    <strong style={{ color: '#e5e7eb' }}>详情解读：</strong> 系统会列出每一处重复的来源，例如：
                    <code style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#a5b4fc', padding: '2px 8px', borderRadius: '4px', fontSize: '0.875rem', margin: '0 4px' }}>[2024年度项目材料] 某报告.docx</code>
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
          className="glass"
          style={{ padding: '32px', borderRadius: '16px', scrollMarginTop: '96px' }}
        >
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', marginBottom: '24px', display: 'flex', alignItems: 'center' }}>
            <span style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.3)', width: '32px', height: '32px', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px', fontSize: '0.875rem' }}>05</span>
            常见问题（FAQ）
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
            {[
              { q: '上传后显示“处理中”很久怎么办？', a: '系统需要提取文档文本并建立倒排索引，大文件或图片PDF可能耗时较长（1-3分钟），请耐心等待或尝试刷新页面。' },
              { q: '为什么检测结果显示 0% 相似度？', a: '这说明您的文档与您勾选的“文档库”中的内容没有任何重复，或者您选择的文档库本身是空的。' },
              { q: '支持哪些文件格式？', a: '目前支持常见的 .pdf, .docx, .doc, .txt 文本文件，以及包含文字的图片格式（jpg, png）。' },
              { q: '一次最多能上传多少文件？', a: '为了保证服务器性能和响应速度，建议单次批量检测不超过 10 个文件。' },
              { q: '如何联系管理员？', a: '如遇账号无法登录、权限错误或系统故障，请直接联系公司 IT 部门或发送邮件至技术支持邮箱。' },
            ].map((item, idx) => (
              <div key={idx} style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', padding: '20px', transition: 'background-color 0.2s', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <h4 style={{ fontWeight: 700, color: 'white', marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ color: '#818cf8', marginRight: '8px' }}>Q:</span>
                  {item.q}
                </h4>
                <p style={{ color: '#9ca3af', paddingLeft: '24px', fontSize: '0.875rem', lineHeight: 1.625, borderLeft: '2px solid rgba(99, 102, 241, 0.3)' }}>
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.875rem', paddingTop: '32px', paddingBottom: '16px' }}>
          &copy; {new Date().getFullYear()} Plagiarism Detection Platform. Internal Use Only.
        </div>
      </main>
      </div>
     </div>
  );
};

export default GuidePage;
