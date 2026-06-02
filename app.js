const { useState, useEffect } = React;

function AssetDashboard() {
  const departments = ['정보화사업처', '경영지원실', '홍보실'];
  
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

  const [assets, setAssets] = useState(() => {
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

  const [selectedDepartment, setSelectedDepartment] = useState('전체');
  const [showModal, setShowModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);

  // 💾 데이터 저장 시 검증
  useEffect(() => {
    try {
      if (!Array.isArray(assets)) {
        console.error('❌ 에러: assets는 배열이어야 합니다.');
        return;
      }

      const isValid = assets.every(asset => 
        asset.id !== undefined &&
        typeof asset.id === 'number' &&
        typeof asset.name === 'string' &&
        typeof asset.expiryDate === 'string'
      );

      if (!isValid) {
        console.error('❌ 에러: 데이터 형식이 올바르지 않습니다.');
        return;
      }

      localStorage.setItem('assets', JSON.stringify(assets));
      console.log(`✅ ${assets.length}개 자산 저장 완료`);
    } catch (error) {
      console.error('❌ LocalStorage 저장 실패:', error);
    }
  }, [assets]);

  // 🔍 유효성 검사 함수
  const validateAsset = (asset) => {
    const errors = [];

    if (!asset.name || asset.name.trim() === '') {
      errors.push('자산명은 필수입니다.');
    } else if (asset.name.length > 100) {
      errors.push('자산명은 100자 이내여야 합니다.');
    }

    if (!asset.type || asset.type.trim() === '') {
      errors.push('자산 종류는 필수입니다.');
    } else if (asset.type.length > 100) {
      errors.push('자산 종류는 100자 이내여야 합니다.');
    }

    if (!asset.location || asset.location.trim() === '') {
      errors.push('위치는 필수입니다.');
    } else if (asset.location.length > 100) {
      errors.push('위치는 100자 이내여야 합니다.');
    }

    if (!asset.expiryDate) {
      errors.push('만료일은 필수입니다.');
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiryDate = new Date(asset.expiryDate);
      
      if (expiryDate < today) {
        errors.push('만료일은 오늘 이후여야 합니다.');
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  };

  // 🧹 데이터 정제 함수
  const sanitizeAsset = (asset) => {
    return {
      id: asset.id || null,
      name: (asset.name || '').trim().substring(0, 100),
      type: (asset.type || '').trim().substring(0, 100),
      department: asset.department || '',
      status: asset.status || '정상',
      expiryDate: asset.expiryDate || '',
      category: asset.category || '',
      location: (asset.location || '').trim().substring(0, 100)
    };
  };

  // 📅 만료일까지의 일수 계산
  const daysUntilExpiry = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diff = expiry - today;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // 상태 판별
  const getExpiryStatus = (expiryDate) => {
    const days = daysUntilExpiry(expiryDate);
    if (days < 0) return 'expired';
    if (days <= 30) return 'warning';
    return 'normal';
  };

  // 필터링
  const filteredAssets = selectedDepartment === '전체'
    ? assets
    : assets.filter(a => a.department === selectedDepartment);

  // 통계
  const stats = {
    total: assets.length,
    normal: assets.filter(a => getExpiryStatus(a.expiryDate) === 'normal').length,
    warning: assets.filter(a => getExpiryStatus(a.expiryDate) === 'warning').length,
  };

  // ✅ 자산 저장 (검증 강화)
  const handleSaveAsset = (asset) => {
    // 1. 유효성 검사
    const validation = validateAsset(asset);
    if (!validation.isValid) {
      alert('오류:\n' + validation.errors.join('\n'));
      return;
    }

    // 2. 데이터 정제
    const sanitized = sanitizeAsset(asset);

    // 3. 수정 시: 원본 자산 확인
    if (editingAsset) {
      const originalExists = assets.some(a => a.id === editingAsset.id);
      
      if (!originalExists) {
        alert('오류: 수정하려는 자산이 더 이상 존재하지 않습니다.');
        setEditingAsset(null);
        return;
      }

      // ID 고정
      sanitized.id = editingAsset.id;

      setAssets(assets.map(a => 
        a.id === editingAsset.id ? sanitized : a
      ));

      console.log(`✅ 자산 수정 완료: ID=${editingAsset.id}`);
    } else {
      // 4. 신규 등록
      const newId = Math.max(...assets.map(a => a.id || 0), 0) + 1;
      sanitized.id = newId;

      setAssets([...assets, sanitized]);
      console.log(`✅ 자산 등록 완료: ID=${newId}`);
    }

    setShowModal(false);
    setEditingAsset(null);
  };

  // 🗑️ 자산 삭제 (이중 확인)
  const handleDeleteAsset = (id) => {
    // 1. 자산 존재 확인
    const assetToDelete = assets.find(a => a.id === id);
    
    if (!assetToDelete) {
      alert('오류: 자산을 찾을 수 없습니다.');
      return;
    }

    // 2. 명확한 확인 메시지
    const confirmed = confirm(
      `다음 자산을 삭제하시겠습니까?\n\n` +
      `자산명: ${assetToDelete.name}\n` +
      `부서: ${assetToDelete.department}\n` +
      `만료일: ${assetToDelete.expiryDate}\n\n` +
      `(이 작업은 되돌릴 수 없습니다.)`
    );

    if (confirmed) {
      // 3. 최종 확인
      const finalAsset = assets.find(a => a.id === id);
      
      if (!finalAsset) {
        alert('오류: 자산이 이미 삭제되었습니다.');
        return;
      }

      setAssets(assets.filter(a => a.id !== id));
      console.log(`✅ 자산 삭제 완료: ID=${id}, 이름=${finalAsset.name}`);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>부서별 자산 및 라이선스 통합 관리 대시보드</h1>
      </header>

      <div style={styles.toolbar}>
        <select
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
          style={styles.select}
        >
          <option value="전체">전체</option>
          {departments.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>

        <button onClick={() => { setEditingAsset(null); setShowModal(true); }} style={styles.addButton}>
          ➕ 자산 추가
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
          validateAsset={validateAsset}
        />
      )}
    </div>
  );
}

function AssetModal({ asset, onSave, onClose, validateAsset }) {
  const [formData, setFormData] = useState(asset || {
    name: '',
    type: '',
    department: '',
    status: '정상',
    expiryDate: '',
    category: '',
    location: ''
  });

  const [errors, setErrors] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const validation = validateAsset(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    
    setErrors([]);
    onSave(formData);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2>{asset ? '자산 수정' : '새 자산 추가'}</h2>
        
        {errors.length > 0 && (
          <div style={styles.errorBox}>
            {errors.map((error, idx) => (
              <p key={idx} style={{ color: '#d9534f', margin: '5px 0' }}>
                • {error}
              </p>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label>자산명 *</label>
            <input 
              name="name" 
              placeholder="자산명" 
              value={formData.name} 
              onChange={handleChange}
              maxLength="100"
              required 
              style={styles.input} 
            />
            <small style={{ color: '#999' }}>
              {formData.name.length}/100
            </small>
          </div>

          <div style={styles.formGroup}>
            <label>자산 종류 *</label>
            <input 
              name="type" 
              placeholder="자산 종류" 
              value={formData.type} 
              onChange={handleChange}
              maxLength="100"
              required 
              style={styles.input} 
            />
            <small style={{ color: '#999' }}>
              {formData.type.length}/100
            </small>
          </div>

          <div style={styles.formGroup}>
            <label>부서 *</label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
              style={styles.input}
            >
              <option value="">부서 선택</option>
              <option value="정보화사업처">정보화사업처</option>
              <option value="경영지원실">경영지원실</option>
              <option value="홍보실">홍보실</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label>만료일 *</label>
            <input 
              name="expiryDate" 
              type="date" 
              value={formData.expiryDate} 
              onChange={handleChange}
              min={today}
              required 
              style={styles.input} 
            />
            <small style={{ color: '#999' }}>
              오늘 이후의 날짜를 선택해주세요.
            </small>
          </div>

          <div style={styles.formGroup}>
            <label>위치 *</label>
            <input 
              name="location" 
              placeholder="위치" 
              value={formData.location} 
              onChange={handleChange}
              maxLength="100"
              required 
              style={styles.input} 
            />
            <small style={{ color: '#999' }}>
              {formData.location.length}/100
            </small>
          </div>

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
  container: { maxWidth: '1200px', margin: '0 auto', padding: '20px' },
  header: { textAlign: 'center', marginBottom: '30px' },
  toolbar: { display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' },
  select: { padding: '8px 12px', borderRadius: '4px', border: '1px solid #ddd' },
  addButton: { padding: '8px 16px', background: '#2ECC71', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
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
  formGroup: { marginBottom: '15px' },
  input: { width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' },
  buttonGroup: { display: 'flex', gap: '10px' },
  submitButton: { flex: 1, padding: '8px', background: '#2ECC71', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  cancelButton: { flex: 1, padding: '8px', background: '#95A5A6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  errorBox: { backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '4px', padding: '12px', marginBottom: '15px', color: '#721c24' }
};

ReactDOM.render(<AssetDashboard />, document.getElementById('root'));
