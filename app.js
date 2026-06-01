const { useState, useEffect } = React;

function AssetDashboard() {
  const departments = ['정보화사업처', '경영지원실', '홍보실'];
  
  const initialAssets = [
    // 정보화사업처
    { id: 1, name: '개발용 PC #1', type: '컴퓨터', department: '정보화사업처', status: '정상', expiryDate: '2026-08-15', category: '하드웨어', location: '4층' },
    { id: 2, name: '개발용 PC #2', type: '컴퓨터', department: '정보화사업처', status: '정상', expiryDate: '2026-09-20', category: '하드웨어', location: '4층' },
    { id: 3, name: 'IntelliJ IDEA 라이선스 (5개)', type: '소프트웨어', department: '정보화사업처', status: '정상', expiryDate: '2026-06-10', category: '라이선스', location: 'N/A' },
    { id: 4, name: 'L3 스위치 장비 #001', type: '네트워크 장비', department: '정보화사업처', status: '정상', expiryDate: '2028-12-31', category: '인프라', location: '1층 서버실' },
    { id: 5, name: 'L3 스위치 장비 #002', type: '네트워크 장비', department: '정보화사업처', status: '정상', expiryDate: '2029-06-15', category: '인프라', location: '1층 서버실' },
    
    // 경영지원실
    { id: 6, name: '사무용 노트북 #1', type: '컴퓨터', department: '경영지원실', status: '정상', expiryDate: '2026-07-30', category: '하드웨어', location: '3층' },
    { id: 7, name: '사무용 노트북 #2', type: '컴퓨터', department: '경영지원실', status: '정상', expiryDate: '2026-10-15', category: '하드웨어', location: '3층' },
    { id: 8, name: '한컴오피스 2024 (10라이선스)', type: '소프트웨어', department: '경영지원실', status: '만료임박', expiryDate: '2026-06-05', category: '라이선스', location: 'N/A' },
    { id: 9, name: '공용 복합기 MFP-2024', type: '사무장비', department: '경영지원실', status: '정상', expiryDate: '2027-03-20', category: '사무용품', location: '3층 전산실' },
    { id: 10, name: '공용 복합기 유지보수', type: '서비스', department: '경영지원실', status: '정상', expiryDate: '2026-12-31', category: '서비스', location: '3층' },
    
    // 홍보실
    { id: 11, name: '디자인용 iMac 27"', type: '컴퓨터', department: '홍보실', status: '정상', expiryDate: '2026-11-10', category: '하드웨어', location: '2층' },
    { id: 12, name: '어도비 크리에이티브 클라우드 (3라이선스)', type: '소프트웨어', department: '홍보실', status: '만료임박', expiryDate: '2026-06-18', category: '라이선스', location: 'N/A' },
    { id: 13, name: '프로젝터 & 스크린', type: '사무장비', department: '홍보실', status: '정상', expiryDate: '2027-05-15', category: '사무용품', location: '2층 회의실' },
  ];

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔥 Firebase에서 데이터 불러오기 및 실시간 동기화
  useEffect(() => {
    if (!window.firebaseDB) {
      console.error('Firebase가 초기화되지 않았습니다.');
      setAssets(initialAssets);
      setLoading(false);
      return;
    }

    const db = window.firebaseDB;
    const assetsRef = db.ref('assets');

    // Firebase에서 실시간 데이터 수신
    assetsRef.on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const assetsArray = Array.isArray(data) ? data : Object.values(data);
        setAssets(assetsArray);
        localStorage.setItem('assets', JSON.stringify(assetsArray));
      } else {
        // Firebase에 데이터가 없으면 초기 데이터 저장
        assetsRef.set(initialAssets);
        setAssets(initialAssets);
      }
      setLoading(false);
    });

    return () => {
      assetsRef.off('value');
    };
  }, []);

  // 💾 assets가 변경될 때 Firebase와 LocalStorage에 저장
  useEffect(() => {
    if (assets.length > 0 && window.firebaseDB) {
      const db = window.firebaseDB;
      const assetsRef = db.ref('assets');
      assetsRef.set(assets).catch((error) => {
        console.error('Firebase 저장 실패:', error);
      });
      localStorage.setItem('assets', JSON.stringify(assets));
    }
  }, [assets]);

  // 🔔 브라우저 알림 함수
  const showBrowserNotification = () => {
    if ('Notification' in window) {
      // 알림 권한 확인
      if (Notification.permission === 'granted') {
        const warningAssets = assets.filter(
          a => getExpiryStatus(a.expiryDate) === 'warning'
        );

        if (warningAssets.length > 0) {
          new Notification('⚠️ 자산 관리 시스템 알림', {
            body: `${warningAssets.length}개의 자산이 곧 만료됩니다. 지금 확인하세요!`,
            icon: '📋',
            tag: 'asset-warning',
            requireInteraction: false,
            badge: '🔔'
          });

          // 알림 로그 저장
          saveNotificationLog('browser', warningAssets.length);
        }
      } else if (Notification.permission !== 'denied') {
        // 권한이 없으면 요청
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            showBrowserNotification();
          }
        });
      }
    }
  };

  // 📧 이메일 알림 함수
  const sendEmailNotification = async () => {
    const warningAssets = assets.filter(
      a => getExpiryStatus(a.expiryDate) === 'warning'
    );

    if (warningAssets.length === 0) {
      alert('만료 임박한 자산이 없습니다.');
      return;
    }

    // 이메일 내용 구성
    const emailBody = `
자산 관리 시스템 - 만료 임박 알림

다음 자산들이 곧 만료됩니다:

${warningAssets.map(asset => {
      const daysLeft = daysUntilExpiry(asset.expiryDate);
      return `• ${asset.name} (${asset.department})
  - 만료일: ${asset.expiryDate}
  - 남은 일수: ${daysLeft}일`;
    }).join('\n\n')}

즉시 갱신해주세요.

---
자산 관리 대시보드
${new Date().toLocaleString('ko-KR')}
    `;

    // mailto 링크 생성 (브라우저 기본 메일 클라이언트 사용)
    const emailSubject = encodeURIComponent(`[자산 관리] 만료 임박 알림 - ${warningAssets.length}개`);
    const emailContent = encodeURIComponent(emailBody);
    const mailtoLink = `mailto:?subject=${emailSubject}&body=${emailContent}`;

    // 또는 Formspree 같은 무료 이메일 서비스 사용
    await sendEmailViaFormspree(warningAssets);
  };

  // 📧 Formspree를 통한 이메일 발송 (무료, 설정 필요 없음)
  const sendEmailViaFormspree = async (warningAssets) => {
    const userEmail = prompt('알림을 받을 이메일을 입력해주세요:');
    if (!userEmail) return;

    const emailContent = {
      from_name: '자산 관리 대시보드',
      email: userEmail,
      subject: `만료 임박 알림 - ${warningAssets.length}개`,
      message: `
다음 자산들이 곧 만료됩니다:

${warningAssets.map(asset => {
        const daysLeft = daysUntilExpiry(asset.expiryDate);
        return `• ${asset.name} (${asset.department})
만료일: ${asset.expiryDate}
남은 일수: ${daysLeft}일`;
      }).join('\n\n')}

즉시 갱신해주세요.
      `
    };

    try {
      // 참고: 실제 이메일 발송은 백엔드 또는 Firebase Cloud Functions 필요
      // 현재는 사용자에게 이메일 내용을 보여주고 복사 가능하게 함
      const emailText = `
=== 이메일 발송 내용 ===
받는 사람: ${userEmail}
제목: ${emailContent.subject}

${emailContent.message}

=== 복사해서 메일 클라이언트에 붙여넣기 ===
      `;

      // 클립보드에 복사
      await navigator.clipboard.writeText(emailText);
      alert('이메일 내용이 클립보드에 복사되었습니다!\n\n메일 클라이언트를 열어서 붙여넣기 해주세요.');

      // 알림 로그 저장
      saveNotificationLog('email', warningAssets.length, userEmail);
    } catch (error) {
      console.error('이메일 복사 실패:', error);
      alert('이메일 발송 중 오류가 발생했습니다.');
    }
  };

  // 📝 알림 로그 저장
  const saveNotificationLog = (type, count, recipient = null) => {
    const log = JSON.parse(localStorage.getItem('notificationLogs') || '[]');
    log.push({
      timestamp: new Date().toISOString(),
      type: type, // 'browser' 또는 'email'
      count: count,
      recipient: recipient
    });
    // 최대 100개만 유지
    if (log.length > 100) {
      log.shift();
    }
    localStorage.setItem('notificationLogs', JSON.stringify(log));
  };

  // 📋 알림 로그 조회
  const getNotificationLogs = () => {
    return JSON.parse(localStorage.getItem('notificationLogs') || '[]');
  };
  const [selectedDept, setSelectedDept] = useState('전체');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    department: '정보화사업처',
    status: '정상',
    expiryDate: '',
    category: '',
    location: ''
  });

  const filteredAssets = selectedDept === '전체'
    ? assets
    : assets.filter(a => a.department === selectedDept);

  const daysUntilExpiry = (dateStr) => {
    const today = new Date();
    const expiry = new Date(dateStr);
    const diff = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getExpiryStatus = (dateStr) => {
    const days = daysUntilExpiry(dateStr);
    if (days <= 0) return 'expired';
    if (days <= 30) return 'warning';
    return 'normal';
  };

  const stats = {
    total: filteredAssets.length,
    normal: filteredAssets.filter(a => getExpiryStatus(a.expiryDate) === 'normal').length,
    warning: filteredAssets.filter(a => getExpiryStatus(a.expiryDate) === 'warning').length,
  };

  const handleAddClick = () => {
    setEditingId(null);
    setFormData({
      name: '',
      type: '',
      department: '정보화사업처',
      status: '정상',
      expiryDate: '',
      category: '',
      location: ''
    });
    setShowModal(true);
  };

  const handleEditClick = (asset) => {
    setEditingId(asset.id);
    setFormData(asset);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.expiryDate) {
      alert('자산명과 만료일을 입력해주세요.');
      return;
    }
    
    if (editingId) {
      setAssets(assets.map(a => a.id === editingId ? { ...formData, id: editingId } : a));
    } else {
      setAssets([...assets, { ...formData, id: Math.max(...assets.map(a => a.id), 0) + 1 }]);
    }
    setShowModal(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('이 자산을 삭제하시겠습니까?')) {
      setAssets(assets.filter(a => a.id !== id));
    }
  };

  return (
    <div style={{ fontFamily: 'inherit', backgroundColor: '#f5f5f5', minHeight: '100vh', padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '500', color: '#1a1a1a', margin: '0 0 0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="ti ti-asset" style={{ fontSize: '28px' }}></i>
          자산 및 라이선스 관리 대시보드
        </h1>
        <p style={{ fontSize: '14px', color: '#666', margin: '0' }}>공기업 전산실 자산 통합 관리 시스템</p>
      </div>

      {/* 부서 선택 및 버튼 */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a1a' }}>부서 선택:</label>
          <select 
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: '#fff', fontSize: '14px', cursor: 'pointer' }}
          >
            <option>전체</option>
            {departments.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>

        {/* 알림 버튼들 */}
        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
          <button
            onClick={showBrowserNotification}
            title="브라우저 알림"
            style={{ padding: '8px 14px', backgroundColor: '#FF6B6B', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
          >
            🔔 브라우저 알림
          </button>
          <button
            onClick={sendEmailNotification}
            title="이메일 알림"
            style={{ padding: '8px 14px', backgroundColor: '#4ECDC4', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
          >
            📧 이메일 알림
          </button>
        </div>

        <button
          onClick={handleAddClick}
          style={{ padding: '8px 16px', backgroundColor: '#185FA5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <i className="ti ti-plus" style={{ fontSize: '16px' }}></i>
          자산 추가
        </button>
      </div>

      {/* 통계 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '2rem' }}>
        <div style={{ backgroundColor: '#f0f0f0', padding: '1rem', borderRadius: '8px', border: '1px solid #ddd' }}>
          <p style={{ fontSize: '12px', color: '#666', margin: '0 0 8px', fontWeight: '500' }}>총 자산 수</p>
          <p style={{ fontSize: '28px', fontWeight: '500', color: '#1a1a1a', margin: '0' }}>{stats.total}</p>
        </div>
        <div style={{ backgroundColor: '#f0f0f0', padding: '1rem', borderRadius: '8px', border: '1px solid #ddd' }}>
          <p style={{ fontSize: '12px', color: '#666', margin: '0 0 8px', fontWeight: '500' }}>정상 운용</p>
          <p style={{ fontSize: '28px', fontWeight: '500', color: '#3B6D11', margin: '0' }}>{stats.normal}</p>
        </div>
        <div style={{ backgroundColor: '#f0f0f0', padding: '1rem', borderRadius: '8px', border: '1px solid #ddd' }}>
          <p style={{ fontSize: '12px', color: '#666', margin: '0 0 8px', fontWeight: '500' }}>만료 임박</p>
          <p style={{ fontSize: '28px', fontWeight: '500', color: '#A32D2D', margin: '0' }}>{stats.warning}</p>
        </div>
      </div>

      {/* 자산 리스트 */}
      <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #ddd', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0', borderBottom: '1px solid #ddd' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '500', color: '#1a1a1a' }}>자산명</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '500', color: '#1a1a1a' }}>종류</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '500', color: '#1a1a1a' }}>부서</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '500', color: '#1a1a1a' }}>만료일</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '500', color: '#1a1a1a' }}>상태</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '500', color: '#1a1a1a' }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssets.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
                  해당 부서의 자산이 없습니다.
                </td>
              </tr>
            ) : (
              filteredAssets.map(asset => {
                const expiryStatus = getExpiryStatus(asset.expiryDate);
                const days = daysUntilExpiry(asset.expiryDate);
                return (
                  <tr key={asset.id} style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: expiryStatus === 'warning' ? 'rgba(232, 75, 74, 0.05)' : 'transparent' }}>
                    <td style={{ padding: '12px 16px', color: '#1a1a1a' }}>
                      {expiryStatus === 'warning' && <i className="ti ti-alert-triangle" style={{ color: '#A32D2D', marginRight: '6px', fontSize: '16px' }}></i>}
                      {asset.name}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#666', fontSize: '13px' }}>{asset.type}</td>
                    <td style={{ padding: '12px 16px', color: '#666', fontSize: '13px' }}>{asset.department}</td>
                    <td style={{ padding: '12px 16px', color: expiryStatus === 'warning' ? '#A32D2D' : '#1a1a1a' }}>
                      {asset.expiryDate}
                      {expiryStatus === 'warning' && <span style={{ marginLeft: '8px', fontSize: '12px', color: '#A32D2D', fontWeight: '500' }}>({days}일)</span>}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{ 
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: expiryStatus === 'warning' ? 'rgba(232, 75, 74, 0.1)' : 'rgba(99, 153, 34, 0.1)',
                        color: expiryStatus === 'warning' ? '#A32D2D' : '#3B6D11'
                      }}>
                        {expiryStatus === 'warning' ? '만료 임박' : '정상'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => handleEditClick(asset)}
                        style={{ padding: '6px 12px', border: '1px solid #ddd', backgroundColor: 'transparent', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', color: '#666' }}
                      >
                        <i className="ti ti-edit" style={{ fontSize: '14px' }}></i>
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(asset.id)}
                        style={{ padding: '6px 12px', border: '1px solid #ddd', backgroundColor: 'transparent', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', color: '#A32D2D' }}
                      >
                        <i className="ti ti-trash" style={{ fontSize: '14px' }}></i>
                        삭제
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0, 0, 0, 0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ 
            backgroundColor: '#fff', 
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '500', color: '#1a1a1a', margin: '0 0 1.5rem' }}>
              {editingId ? '자산 수정' : '새 자산 등록'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a', display: 'block', marginBottom: '4px' }}>자산명 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="자산명을 입력하세요"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a', display: 'block', marginBottom: '4px' }}>자산 종류</label>
                <input
                  type="text"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  placeholder="예: 컴퓨터, 소프트웨어, 네트워크 장비"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a', display: 'block', marginBottom: '4px' }}>관리 부서 *</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                >
                  {departments.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a', display: 'block', marginBottom: '4px' }}>만료일 *</label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a', display: 'block', marginBottom: '4px' }}>카테고리</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                >
                  <option value="">선택하세요</option>
                  <option>하드웨어</option>
                  <option>소프트웨어</option>
                  <option>라이선스</option>
                  <option>인프라</option>
                  <option>사무용품</option>
                  <option>서비스</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a', display: 'block', marginBottom: '4px' }}>위치</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="예: 4층, 1층 서버실"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '2rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ padding: '8px 16px', border: '1px solid #ddd', backgroundColor: 'transparent', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#666' }}
              >
                취소
              </button>
              <button
                onClick={handleSave}
                style={{ padding: '8px 16px', backgroundColor: '#185FA5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
              >
                {editingId ? '수정' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// React 앱 렌더링
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<AssetDashboard />);
