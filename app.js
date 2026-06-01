const { useState, useEffect } = React;

function AssetDashboard() {
  const departments = ['전체', '정보화사업처', '경영지원실', '홍보실'];
  
  const initialAssets = [
    { id: 1, name: '개발용 PC #1', type: '컴퓨터', department: '정보화사업처', status: '정상', expiryDate: '2026-08-15', category: '하드웨어', location: '4층' },
    { id: 2, name: '개발용 PC #2', type: '컴퓨터', department: '정보화사업처', status: '정상', expiryDate: '2026-09-20', category: '하드웨어', location: '4층' },
    { id: 3, name: 'IntelliJ IDEA 라이선스 (5개)', type: '소프트웨어', department: '정보화사업처', status: '정상', expiryDate: '2026-06-10', category: '라이선스', location: 'N/A' },
    { id: 4, name: 'L3 스위치 장비 #001', type: '네트워크 장비', department: '정보화사업처', status: '정상', expiryDate: '2028-12-31', category: '인프라', location: '1층 서버실' },
    { id: 5, name: 'L3 스위치 장비 #002', type: '네트워크 장비', department: '정보화사업처', status: '정상', expiryDate: '2029-06-15', category: '인프라', location: '1층 서버실' },
    { id: 6, name: '사무용 노트북 #1', type: '컴퓨터', department: '경영지원실', status: '정상', expiryDate: '2026-07-30', category: '하드웨어', location: '3층' },
    { id: 7, name: '사무용 노트북 #2', type: '컴퓨터', department: '경영지원실', status: '정상', expiryDate: '2026-10-15', category: '하드웨어', location: '3층' },
    { id: 8, name: '한컴오피스 2024 (10라이선스)', type: '소프트웨어', department: '경영지원실', status: '만료임박', expiryDate: '2026-06-05', category: '라이선스', location: 'N/A' },
    { id: 9, name: '공용 복합기 MFP-2024', type: '사무장비', department: '경영지원실', status: '정상', expiryDate: '2027-03-20', category: '사무용품', location: '3층 전산실' },
    { id: 10, name: '공용 복합기 유지보수', type: '서비스', department: '경영지원실', status: '정상', expiryDate: '2026-12-31', category: '서비스', location: '3층' },
    { id: 11, name: '디자인용 iMac 27"', type: '컴퓨터', department: '홍보실', status: '정상', expiryDate: '2026-11-10', category: '하드웨어', location: '2층' },
    { id: 12, name: '어도비 크리에이티브 클라우드 (3라이선스)', type: '소프트웨어', department: '홍보실', status: '만료임박', expiryDate: '2026-06-18', category: '라이선스', location: 'N/A' },
    { id: 13, name: '프로젝터 & 스크린', type: '사무장비', department: '홍보실', status: '정상', expiryDate: '2027-05-15', category: '사무용품', location: '2층 회의실' },
  ];

  const [assets, setAssets] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('전체');
  const [showModal, setShowModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔥 Firebase에서 데이터 불러오기
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
        // 배열 또는 객체를 배열로 변환
        const assetsArray = Array.isArray(data) ? data : Object.values(data);
        setAssets(assetsArray);
        // LocalStorage에도 백업 저장
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

  // 💾 assets가 변경될 때 Firebase에 저장
  useEffect(() => {
    if (assets.length > 0 && window.firebaseDB) {
      const db = window.firebaseDB;
      const assetsRef = db.ref('assets');
      assetsRef.set(assets).catch((error) => {
        console.error('Firebase 저장 실패:', error);
      });
    }
  }, [assets]);

  // 만료일까지의 일수 계산
  const daysUntilExpiry = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diff = expiry - today;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // 만료 상태 판별
  const getExpiryStatus = (expiryDate) => {
    const days = daysUntilExpiry(expiryDate);
    if (days < 0) return 'expired';
    if (days <= 30) return 'warning';
    return 'normal';
  };

  // 부서별 필터링
  const filteredAssets = selectedDepartment === '전체'
    ? assets
    : assets.filter(a => a.department === selectedDepartment);

  // 통계 계산
  const stats = {
    total: assets.length,
    normal: assets.filter(a => getExpiryStatus(a.expiryDate) === 'normal').length,
    warning: assets.filter(a => getExpiryStatus(a.expiryDate) === 'warning').length,
  };

  // 자산 추가/수정
  const handleSaveAsset = (asset) => {
    if (editingAsset) {
      setAssets(assets.map(a => a.id === asset.id ? asset : a));
    } else {
      asset.id = Math.max(...assets.map(a => a.id || 0), 0) + 1;
      setAssets([...assets, asset]);
    }
    setShowModal(false);
    setEditingAsset(null);
  };

  // 자산 삭제
  const handleDeleteAsset = (id) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      setAssets(assets.filter(a => a.id !== id));
    }
  };

  // 🔔 브라우저 알림
  const showBrowserNotification = () => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        const warningAssets = assets.filter(a => getExpiryStatus(a.expiryDate) === 'warning');
        if (warningAssets.length > 0) {
          new Notification('⚠️ 자산 관리 시스템 알림', {
            body: `${warningAssets.length}개의 자산이 곧 만료됩니다!`,
            icon: '📋'
          });
          saveNotificationLog('browser', warningAssets.length);
        }
      } else {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') showBrowserNotification();
        });
      }
    }
  };

  // 📧 이메일 알림
  const sendEmailNotification = () => {
    const warningAssets = assets.filter(a => getExpiryStatus(a.expiryDate) === 'warning');
    if (warningAssets.length === 0) {
      alert('만료 임박한 자산이 없습니다.');
      return;
    }

    const emailBody = `자산 관리 시스템 - 만료 임박 알림\n\n${warningAssets.map(asset => {
      const daysLeft = daysUntilExpiry(asset.expiryDate);
      return `• ${asset.name} (${asset.department})\n  만료일: ${asset.expiryDate} (${daysLeft}일)`;
    }).join('\n\n')}`;

    navigator.clipboard.writeText(emailBody);
    alert('이메일 내용이 클립보드에 복사되었습니다.');
    saveNotificationLog('email', warningAssets.length);
  };

  // 알림 로그 저장
  const saveNotificationLog = (type, count) => {
    const logs = JSON.parse(localStorage.getItem('notificationLogs') || '[]');
    logs.push({
      timestamp: new Date().toISOString(),
      type,
      count
    });
    if (logs.length > 100) logs.shift();
    localStorage.setItem('notificationLogs', JSON.stringify(logs));
  };

  if (loading) {
    return <div style={{padding: '20px', textAlign: 'center'}}>Firebase에서 데이터를 불러오는 중...</div>;
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>부서별 자산 및 라이선스 통합 관리 대시보드</h1>
        <p>자산 및 라이선스의 만료일을 효율적으로 관리하세요</p>
      </header>

      <div style={styles.toolbar}>
        <div style={styles.departmentSelector}>
          <label>부서 선택: </label>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            style={styles.select}
          >
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        <button onClick={() => { setEditingAsset(null); setShowModal(true); }} style={styles.addButton}>
          ➕ 자산 추가
        </button>

        <button onClick={showBrowserNotification} style={{...styles.button, background: '#FF6B6B'}}>
          🔔 브라우저 알림
        </button>

        <button onClick={sendEmailNotification} style={{...styles.button, background: '#4ECDC4'}}>
          📧 이메일 알림
        </button>
      </div>

      <div style={styles.statsContainer}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{stats.total}</div>
          <div style={styles.statLabel}>총 자산 수</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{stats.normal}</div>
          <div style={styles.statLabel}>정상 운용</div>
        </div>
        <div style={{...styles.statCard, borderColor: '#FF6B6B'}}>
          <div style={{...styles.statValue, color: '#FF6B6B'}}>{stats.warning}</div>
          <div style={styles.statLabel}>만료 임박</div>
        </div>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th>자산명</th>
              <th>유형</th>
              <th>부서</th>
              <th>만료일</th>
              <th>상태</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssets.map(asset => {
              const status = getExpiryStatus(asset.expiryDate);
              const daysLeft = daysUntilExpiry(asset.expiryDate);
              return (
                <tr key={asset.id} style={{...styles.tableRow, ...(status === 'warning' ? styles.warningRow : {})}}>
                  <td>{asset.name}</td>
                  <td>{asset.type}</td>
                  <td>{asset.department}</td>
                  <td>{asset.expiryDate}</td>
                  <td>
                    {status === 'warning' && <span style={{color: '#FF6B6B'}}>⚠️ {daysLeft}일</span>}
                    {status === 'normal' && <span style={{color: '#2ECC71'}}>정상</span>}
                    {status === 'expired' && <span style={{color: '#E74C3C'}}>만료됨</span>}
                  </td>
                  <td>
                    <button onClick={() => { setEditingAsset(asset); setShowModal(true); }} style={styles.actionButton}>
                      ✏️
                    </button>
                    <button onClick={() => handleDeleteAsset(asset.id)} style={styles.deleteButton}>
                      🗑️
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <AssetModal
          asset={editingAsset}
          onSave={handleSaveAsset}
          onClose={() => { setShowModal(false); setEditingAsset(null); }}
        />
      )}
    </div>
  );
}

function AssetModal({ asset, onSave, onClose }) {
  const [formData, setFormData] = useState(asset || {
    name: '',
    type: '',
    department: '',
    status: '정상',
    expiryDate: '',
    category: '',
    location: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2>{asset ? '자산 수정' : '새 자산 추가'}</h2>
        <form onSubmit={handleSubmit}>
          <input name="name" placeholder="자산명" value={formData.name} onChange={handleChange} required style={styles.input} />
          <input name="type" placeholder="유형" value={formData.type} onChange={handleChange} required style={styles.input} />
          <input name="department" placeholder="부서" value={formData.department} onChange={handleChange} required style={styles.input} />
          <input name="expiryDate" type="date" value={formData.expiryDate} onChange={handleChange} required style={styles.input} />
          <input name="location" placeholder="위치" value={formData.location} onChange={handleChange} style={styles.input} />
          <div style={styles.buttonGroup}>
            <button type="submit" style={styles.submitButton}>저장</button>
            <button type="button" onClick={onClose} style={styles.cancelButton}>취소</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'Arial' },
  header: { textAlign: 'center', marginBottom: '30px', color: '#333' },
  toolbar: { display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' },
  departmentSelector: { display: 'flex', gap: '10px', alignItems: 'center' },
  select: { padding: '8px 12px', borderRadius: '4px', border: '1px solid #ddd' },
  addButton: { padding: '8px 16px', background: '#2ECC71', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  button: { padding: '8px 16px', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  statsContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' },
  statCard: { padding: '20px', background: '#f8f9fa', borderRadius: '8px', borderLeft: '4px solid #2ECC71', textAlign: 'center' },
  statValue: { fontSize: '28px', fontWeight: 'bold', color: '#2ECC71' },
  statLabel: { color: '#666', marginTop: '8px' },
  tableContainer: { overflowX: 'auto', marginBottom: '30px' },
  table: { width: '100%', borderCollapse: 'collapse', background: 'white' },
  tableHeader: { background: '#34495E', color: 'white' },
  tableRow: { borderBottom: '1px solid #ddd' },
  warningRow: { background: '#FFE5E5' },
  actionButton: { padding: '4px 8px', marginRight: '5px', background: '#3498DB', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' },
  deleteButton: { padding: '4px 8px', background: '#E74C3C', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal: { background: 'white', padding: '30px', borderRadius: '8px', maxWidth: '500px', width: '90%' },
  input: { width: '100%', padding: '8px', marginBottom: '12px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' },
  buttonGroup: { display: 'flex', gap: '10px' },
  submitButton: { flex: 1, padding: '8px', background: '#2ECC71', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  cancelButton: { flex: 1, padding: '8px', background: '#95A5A6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }
};

ReactDOM.render(<AssetDashboard />, document.getElementById('root'));
