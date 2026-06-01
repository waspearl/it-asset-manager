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

  const [assets, setAssets] = useState(() => {
    // 📥 LocalStorage에서 저장된 데이터 불러오기
    const saved = localStorage.getItem('assets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('LocalStorage 데이터 로드 실패:', e);
        return initialAssets;
      }
    }
    return initialAssets;
  });

  // 💾 assets가 변경될 때마다 LocalStorage에 저장
  useEffect(() => {
    localStorage.setItem('assets', JSON.stringify(assets));
  }, [assets]);
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
        <button
          onClick={handleAddClick}
          style={{ marginLeft: 'auto', padding: '8px 16px', backgroundColor: '#185FA5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}
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
