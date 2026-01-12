//КОНСТАНТЫ И ПЕРЕМЕННЫЕ
const API_BASE_URL = 'http://exam-api-courses.std-900.ist.mospolytech.ru/';
let apiKey = 'cfaa433f-0bdc-4590-95ed-028417a2eb49';
let currentPageCourses = 1; //текущая страница таблицы курсов
let currentPageOrders = 1; //текущая страница таблицы заявок
const ITEMS_PER_PAGE = 5; //количество элементов на одной странице таблицы
//глобальные переменные для хранения данных
let allCourses = []; //все курсы, загруженные с сервера
let allTutors = []; //все репетиторы, загруженные с сервера
let allOrders = []; //все заявки, загруженные с сервера
//выбранные пользователем элементы
let selectedCourse = null; //выбранный курс для оформления заявки
let selectedTutor = null; //выбранный репетитор для оформления заявки

//УТИЛИТЫ
/*
 * Показывает временное уведомление пользователю
 * @param {string} message - Текст сообщения
 * @param {string} type - Тип уведомления: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Время показа в миллисекундах
 */
// Показать уведомление
function showNotification(message, type = 'info', duration = 5000) {
     //находим область для уведомлений на странице
    const notificationArea = document.getElementById('notification-area');
    if (!notificationArea) return; //если элемента нет, выходим из функции
    
    //определяем CSS класс для типа уведомления
    const alertClass = {
        'success': 'alert-success',
        'error': 'alert-danger',
        'warning': 'alert-warning',
        'info': 'alert-info'
    }[type] || 'alert-info';
    
    //создаем элемент уведомления
    const alert = document.createElement('div');
    alert.className = `alert ${alertClass} alert-dismissible fade show`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    //добавляем уведомление в область
    notificationArea.appendChild(alert);
    
    //автоматически удаляем уведомление через указанное время
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, duration);
}

// Добавить параметр api_key к URL
function addApiKey(url) {
    //проверяем, установлен ли API ключ
    if (!apiKey) {
        showNotification('Ошибка: API ключ не установлен. Получите ключ из СДО.', 'error');
        return url;
    }
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}api_key=${apiKey}`;
}

// Форматирование даты
function formatDate(dateString) {
    if (!dateString) return ''; //если дата пустая, возвращаем пустую строку
    const date = new Date(dateString); //создаем объект Date из строки
    return date.toLocaleDateString('ru-RU'); //форматируем в российский формат
}

// Форматирование времени
function formatTime(timeString) {
    if (!timeString) return '';
    return timeString.substring(0, 5); //берем первые 5 символов (ЧЧ:ММ)
}

// Перевод уровня
function translateLevel(level) {
    //словарь для перевода
    const levels = {
        'beginner': 'Начальный',
        'intermediate': 'Средний',
        'advanced': 'Продвинутый'
    };
    return levels[level?.toLowerCase()] || level; //если перевода нет, возвращаем оригинал
}

// Цвет для уровня
function getLevelColor(level) {
    const colors = {
        'beginner': 'success',
        'intermediate': 'warning',
        'advanced': 'danger'
    };
    return colors[level?.toLowerCase()] || 'secondary';
}
