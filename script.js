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

//РАБОТА С API

// Получить курсы
/*
 * Загружает все курсы с сервера
 * @returns {Promise<Array>} Массив курсов
 */
async function fetchCourses() {
    try {
         //формируем URL с API ключом
        const url = addApiKey(API_BASE_URL + 'api/courses');
        const response = await fetch(url); //отправляем GET запрос
        
        //проверяем статус ответа
        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }
        
         //парсим JSON ответ
        const data = await response.json();
        allCourses = data; //сохраняем в глобальную переменную
        return data;
        //обрабатываем ошибки
    } catch (error) {
        console.error('Ошибка при загрузке курсов:', error);
        showNotification('Ошибка при загрузке курсов', 'error');
        return [];
    }
}

// Получить репетиторов
/*
 * Загружает всех репетиторов с сервера
 * @returns {Promise<Array>} Массив репетиторов
 */
async function fetchTutors() {
    try {
        const url = addApiKey(API_BASE_URL + 'api/tutors');
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        allTutors = data; //сохраняем в глобальную переменную
        return data;
        //обрабатываем ошибки
    } catch (error) {
        console.error('Ошибка при загрузке репетиторов:', error);
        showNotification('Ошибка при загрузке репетиторов', 'error');
        return [];
    }
}

// Получить заявки
/*
 * Загружает все заявки пользователя
 * @returns {Promise<Array>} Массив заявок
 */
async function fetchOrders() {
    try {
        const url = addApiKey(API_BASE_URL + 'api/orders');
        const response = await fetch(url);
        
        if (!response.ok) {
            //обрабатываем ошибку 403 (не авторизован)
            if (response.status === 403) {
                showNotification('Ошибка авторизации. Проверьте API ключ.', 'error');
                return [];
            }
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        allOrders = data; //сохраняем в глобальную переменную
        return data;
        //обрабатываем ошибки
    } catch (error) {
        console.error('Ошибка при загрузке заявок:', error);
        showNotification('Ошибка при загрузке заявок', 'error');
        return [];
    }
}

// Создать заявку
/*
 * Создает новую заявку на сервере
 * @param {Object} orderData - Данные заявки
 * @returns {Promise<Object>} Созданная заявка
 */
async function createOrder(orderData) {
    try {
        const url = addApiKey(API_BASE_URL + 'api/orders');
        //отправляем POST запрос с данными в формате JSON
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });
        
        const result = await response.json();
        
        //проверяем успешность запроса
        if (!response.ok) {
            throw new Error(result.error || 'Ошибка при создании заявки');
        }
        
         //показываем уведомление об успехе
        showNotification('Заявка успешно создана!', 'success');
        return result;
    } catch (error) {
        console.error('Ошибка при создании заявки:', error);
        showNotification(`Ошибка: ${error.message}`, 'error');
        throw error;
    }
}

// Обновить заявку
/*
 * Обновляет существующую заявку
 * @param {number} orderId - ID заявки
 * @param {Object} orderData - Новые данные заявки
 * @returns {Promise<Object>} Обновленная заявка
 */
async function updateOrder(orderId, orderData) {
    try {
        const url = addApiKey(API_BASE_URL + `api/orders/${orderId}`);
        //отправляем PUT запрос для обновления
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Ошибка при обновлении заявки');
        }
        
        showNotification('Заявка успешно обновлена!', 'success');
        return result;
    } catch (error) {
        console.error('Ошибка при обновлении заявки:', error);
        showNotification(`Ошибка: ${error.message}`, 'error');
        throw error;
    }
}

// Удалить заявку
/*
 * Удаляет заявку
 * @param {number} orderId - ID заявки
 * @returns {Promise<Object>} Результат удаления
 */
async function deleteOrder(orderId) {
    try {
        const url = addApiKey(API_BASE_URL + `api/orders/${orderId}`);
        const response = await fetch(url, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Ошибка при удалении заявки');
        }
        
        return result;
    } catch (error) {
        console.error('Ошибка при удалении заявки:', error);
        throw error;
    }
}