// グローバル変数
let allReports = [];
let filteredReports = [];

const GAS_URL = 'https://script.google.com/macros/s/AKfycbx369yDkErdOsll-U6gcMimOIs63IGMQXfffEd-LU46QOF8AfPDNnoRnHkqQGr_VYFDgA/exec';
const FORM_URL = 'https://forms.gle/4oDkGRzRj1NppeCE9';

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    fetchReports();
    setupEventListeners();
});

// イベントリスナー設定
function setupEventListeners() {
    document.getElementById('headquartersFilter').addEventListener('change', function() {
        updateDepartmentFilter();
        filterReports();
    });
    
    document.getElementById('departmentFilter').addEventListener('change', filterReports);
    document.getElementById('searchInput').addEventListener('input', filterReports);
}

// データ取得
async function fetchReports() {
    try {
        showStatus('データを読み込み中...');
        hideError();
        
        const response = await fetch(GAS_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            allReports = result.data || [];
            updateFilters();
            filterReports();
            showStatus(`${allReports.length}件の日報を読み込みました`);
        } else {
            throw new Error(result.error || 'データの取得に失敗しました');
        }
        
    } catch (error) {
        console.error('データ取得エラー:', error);
        showError(`エラー: ${error.message}`);
        
        // エラー時はサンプルデータを表示
        // allReports = [
        //     {
        //         id: 1,
        //         '日付': '2024-09-07',
        //         '時刻': '18:30',
        //         'メールアドレス': 'test@example.com',
        //         '本部': '総務本部',
        //         '部署': '情報部',
        //         '仕事内容': '新しいシステムの導入について検討しました。',
        //         '明日の予定・課題': 'システム要件の詳細を確認する',
        //         '連絡事項': ''
        //     },
        //     {
        //         id: 2,
        //         '日付': '2024-09-07',
        //         '時刻': '17:45',
        //         'メールアドレス': 'test2@example.com',
        //         '本部': '行事本部 - 文化祭',
        //         '部署': 'ポスパン',
        //         '仕事内容': 'ポスター制作の進捗確認をしました。',
        //         '明日の予定・課題': 'デザインの最終確認',
        //         '連絡事項': '来週のミーティングについて'
        //     }
        // ];
        updateFilters();
        filterReports();
        showStatus('サンプルデータを表示しています');
    }
}

// フィルター更新
function updateFilters() {
    // 本部一覧を更新
    const headquarters = [...new Set(allReports.map(r => r['本部']).filter(h => h))];
    const hqSelect = document.getElementById('headquartersFilter');
    const currentHq = hqSelect.value;
    
    hqSelect.innerHTML = '<option value="">全本部</option>';
    headquarters.forEach(hq => {
        const option = document.createElement('option');
        option.value = hq;
        option.textContent = hq;
        if (hq === currentHq) option.selected = true;
        hqSelect.appendChild(option);
    });

    updateDepartmentFilter();
}

// 部署フィルター更新
function updateDepartmentFilter() {
    const selectedHq = document.getElementById('headquartersFilter').value;
    const deptSelect = document.getElementById('departmentFilter');
    const currentDept = deptSelect.value;
    
    // 選択された本部に関連する部署のみ表示
    let departments;
    if (selectedHq) {
        departments = [...new Set(
            allReports
                .filter(r => r['本部'] === selectedHq)
                .map(r => r['部署'])
                .filter(d => d)
        )];
    } else {
        departments = [...new Set(allReports.map(r => r['部署']).filter(d => d))];
    }
    
    deptSelect.innerHTML = '<option value="">全部署</option>';
    departments.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept;
        option.textContent = dept;
        if (dept === currentDept) option.selected = true;
        deptSelect.appendChild(option);
    });
}

// フィルタリング
function filterReports() {
    const selectedHq = document.getElementById('headquartersFilter').value;
    const selectedDept = document.getElementById('departmentFilter').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    filteredReports = allReports.filter(report => {
        // 本部フィルター
        if (selectedHq && report['本部'] !== selectedHq) return false;
        
        // 部署フィルター
        if (selectedDept && report['部署'] !== selectedDept) return false;
        
        // 検索フィルター
        if (searchTerm) {
            const searchableText = [
                report['本部'] || '',
                report['部署'] || '',
                report['仕事内容'] || '',
                report['明日の予定・課題'] || '',
                report['連絡事項'] || ''
            ].join(' ').toLowerCase();
            
            if (!searchableText.includes(searchTerm)) return false;
        }
        
        return true;
    });

    // 日付順にソート（新しい順）
    filteredReports.sort((a, b) => {
        const dateA = new Date(a['日付'] + ' ' + a['時刻']);
        const dateB = new Date(b['日付'] + ' ' + b['時刻']);
        return dateB - dateA;
    });

    displayReports();
    updateStatus();
}

// 日報表示
function displayReports() {
    const container = document.getElementById('reportsList');
    
    if (filteredReports.length === 0) {
        container.innerHTML = '<div class="no-data">該当する日報が見つかりませんでした</div>';
        return;
    }

    container.innerHTML = filteredReports.map(report => `
        <div class="report-card">
            <div class="report-header">
                <div class="report-date">
                    ${formatDate(report['日付'])} ${formatTime(report['時刻'])}
                </div>
                <div class="report-tags">
                    <span class="tag tag-headquarters">${report['本部'] || ''}</span>
                    <span class="tag tag-department">${report['部署'] || ''}</span>
                </div>
            </div>
            <div class="report-content">

                ${report['連絡事項'] ? `
                
                <div class="content-section">
                    <div class="content-title">連絡事項</div>
                    <div class="content-text">${report['連絡事項']}</div>
                </div>` : ''}

                <div class="content-section">
                    <div class="content-title">仕事内容</div>
                    <div class="content-text">${report['仕事内容'] || ''}</div>
                </div>

                ${report['明日の予定・課題'] ? `

                <div class="content-section">
                    <div class="content-title">明日の予定・課題</div>
                    <div class="content-text">${report['明日の予定・課題']}</div>
                </div>` : ''}
            </div>
        </div>
    `).join('');
}

// 日付フォーマット
function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const weekday = weekdays[date.getDay()];
    return `${month}月${day}日(${weekday})`;
}

// 時刻フォーマット
function formatTime(timeStr) {
    if (!timeStr) return '';
    try {
        const date = new Date(timeStr);
        if (isNaN(date.getTime())) {
            return timeStr;
        }
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    } catch (e) {
        return timeStr;
    }
}

// ステータス更新
function updateStatus() {
    showStatus(`${filteredReports.length}件の日報が見つかりました`);
}

// ステータス表示
function showStatus(message) {
    document.getElementById('statusText').textContent = message;
}

// エラー表示
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.innerHTML = `<div class="error">${message}</div>`;
}

// エラー非表示
function hideError() {
    document.getElementById('errorMessage').innerHTML = '';
}

// フィルターリセット
function resetFilters() {
    document.getElementById('headquartersFilter').value = '';
    document.getElementById('departmentFilter').value = '';
    document.getElementById('searchInput').value = '';
    updateDepartmentFilter();
    filterReports();
}

// フォームを開く
function openForm() {
    window.open(FORM_URL, '_blank');
}
