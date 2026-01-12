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
//ОТОБРАЖЕНИЕ ДАННЫХ

// Отобразить курсы
/*
 * Отображает курсы в таблице с пагинацией
 * @param {Array} courses - Массив курсов
 * @param {number} page - Номер страницы
 */
function displayCourses(courses, page = 1) {
    const tbody = document.getElementById('courses-body');
    if (!tbody) return; //если таблицы нет на странице, выходим
    
    //рассчитываем, какие курсы показывать на текущей странице
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const coursesToShow = courses.slice(startIndex, endIndex);
    
    //очищаем таблицу
    tbody.innerHTML = '';
    
    //если курсов нет, показываем сообщение
    if (coursesToShow.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <div class="text-muted">
                        <i class="bi bi-book fs-1 mb-3"></i>
                        <p class="fs-5">Курсы не найдены</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
     //создаем строки для каждого курса
    coursesToShow.forEach(course => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <strong>${course.name}</strong>
                <div class="small text-muted">${course.description.substring(0, 50)}...</div>
            </td>
            <td>${course.teacher}</td>
            <td>
                <span class="badge bg-${getLevelColor(course.level)}">
                    ${translateLevel(course.level)}
                </span>
            </td>
            <td>${course.total_length} недель</td>
            <td>${course.week_length} часов/неделя</td>
            <td>${course.course_fee_per_hour} руб./час</td>
            <td>
                <button class="btn btn-sm btn-primary select-course-btn" data-course-id="${course.id}">
                    Выбрать
                </button>
            </td>
        `;
        tbody.appendChild(row); //добавляем строку в таблицу
    });
    
    //настраиваем пагинацию
    setupPagination(courses, 'courses-pagination', page, (pageNum) => {
        displayCourses(courses, pageNum);
        setupCourseSelection(); //при смене страницы нужно заново настраивать обработчики
    });
}

// Отобразить репетиторов
/*
 * Отображает репетиторов в таблице с фильтрацией
 * @param {Array} tutors - Массив репетиторов
 * @param {Object} filters - Фильтры для поиска
 */
function displayTutors(tutors, filters = {}) {
    const tbody = document.getElementById('tutors-body');
    if (!tbody) return;
    
    //применяем фильтры
    let filteredTutors = tutors;
    
    //фильтр по языку
    if (filters.language) {
        filteredTutors = filteredTutors.filter(tutor => 
            tutor.languages_offered && 
            tutor.languages_offered.some(lang => 
                lang.toLowerCase().includes(filters.language.toLowerCase())
            )
        );
    }
    //фильтр по уровню
    if (filters.level) {
        filteredTutors = filteredTutors.filter(tutor => 
            tutor.language_level.toLowerCase() === filters.level.toLowerCase()
        );
    }
    
    //фильтр по опыту
    if (filters.experience) {
        filteredTutors = filteredTutors.filter(tutor => 
            tutor.work_experience >= parseInt(filters.experience)
        );
    }
    
    //очищаем таблицу
    tbody.innerHTML = '';
    
    //если репетиторов нет, показываем сообщение
    if (filteredTutors.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <div class="text-muted">
                        <i class="bi bi-person fs-1 mb-3"></i>
                        <p class="fs-5">Репетиторы не найдены</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    //создаем строки для каждого репетитора
    filteredTutors.forEach(tutor => {
        //проверяем, выбран ли этот репетитор
        const isSelected = selectedTutor && selectedTutor.id === tutor.id;
        
        const row = document.createElement('tr');
         //подсвечиваем строку, если репетитор выбран
        if (isSelected) {
            row.classList.add('table-primary');
        }
        row.innerHTML = `
            <td>${tutor.name}</td>
            <td>
                <span class="badge bg-${getLevelColor(tutor.language_level)}">
                    ${translateLevel(tutor.language_level)}
                </span>
            </td>
            <td>${tutor.languages_offered?.join(', ') || 'Не указано'}</td>
            <td>${tutor.work_experience} лет</td>
            <td>${tutor.price_per_hour} руб./час</td>
            <td>
                <img src="https://via.placeholder.com/50x50?text=Tutor" 
                     alt="${tutor.name}" 
                     class="rounded-circle"
                     width="50" 
                     height="50">
            </td>
            <td>
                <button class="btn btn-sm ${isSelected ? 'btn-success' : 'btn-outline-primary'} select-tutor-btn" 
                        data-tutor-id="${tutor.id}">
                    ${isSelected ? 'Выбран' : 'Выбрать'}
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Отобразить заявки в личном кабинете
/*
 * Отображает заявки в личном кабинете
 * @param {Array} orders - Массив заявок
 * @param {number} page - Номер страницы
 */
function displayOrders(orders, page = 1) {
    const tbody = document.getElementById('orders-body');
    const noOrdersRow = document.getElementById('no-orders-row');
    const pagination = document.getElementById('orders-pagination');
    
    if (!tbody) return;
    
    //рассчитываем, какие заявки показывать
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const ordersToShow = orders.slice(startIndex, endIndex);
    
    //если заявок нет, показываем сообщение
    if (orders.length === 0) {
        if (noOrdersRow) noOrdersRow.style.display = '';
        if (pagination) pagination.style.display = 'none';
        updateStatistics(orders); //обновляем статистику
        return;
    }
    
     //скрываем сообщение "нет заявок" и показываем пагинацию
    if (noOrdersRow) noOrdersRow.style.display = 'none';
    if (pagination) pagination.style.display = 'block';
    
    //очищаем таблицу
    tbody.innerHTML = '';
    
    //создаем строки для каждой заявки
    ordersToShow.forEach((order, index) => {
        const orderNumber = startIndex + index + 1; //номер по порядку
        const orderType = order.course_id ? 'Курс' : 'Репетитор';
        //находим название курса или репетитора
        const orderName = order.course_id ? 
            (allCourses.find(c => c.id === order.course_id)?.name || 'Курс') :
            (allTutors.find(t => t.id === order.tutor_id)?.name || 'Репетитор');
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${orderNumber}</td>
            <td>
                <strong>${orderName}</strong>
                <div class="small text-muted">${orderType}</div>
            </td>
            <td>${formatDate(order.date_start)}</td>
            <td>${formatTime(order.time_start)}</td>
            <td>${order.persons} чел.</td>
            <td>${order.price} руб.</td>
            <td>
                <span class="badge bg-success">Активна</span>
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-info view-order-btn" data-order-id="${order.id}">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-outline-warning edit-order-btn" data-order-id="${order.id}">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-outline-danger delete-order-btn" data-order-id="${order.id}">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    //обновляем статистику и пагинацию
    updateStatistics(orders);
    setupPagination(orders, 'orders-pagination', page, (pageNum) => {
        displayOrders(orders, pageNum);
    });
}

// Настройка пагинации
/*
 * Настраивает пагинацию для таблицы
 * @param {Array} items - Все элементы
 * @param {string} paginationId - ID элемента пагинации
 * @param {number} currentPage - Текущая страница
 * @param {Function} displayFunction - Функция для отображения страницы
 */
function setupPagination(items, paginationId, currentPage, displayFunction) {
    const pagination = document.getElementById(paginationId);
    if (!pagination) return;
    
    //вычисляем общее количество страниц
    const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
    
     //если всего одна страница, скрываем пагинацию
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    //кнопка "Назад"
    if (currentPage > 1) {
        paginationHTML += `
            <li class="page-item">
                <a class="page-link" href="#" data-page="${currentPage - 1}">Предыдущая</a>
            </li>
        `;
    } else {
        paginationHTML += `
            <li class="page-item disabled">
                <a class="page-link" href="#">Предыдущая</a>
            </li>
        `;
    }
    
    //номера страниц
    const maxVisiblePages = 5; //максимальное количество видимых страниц
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    //корректируем диапазон, если он слишком маленький
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    //создаем ссылки на страницы
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${i}">${i}</a>
            </li>
        `;
    }
    
    //кнопка "Вперед"
    if (currentPage < totalPages) {
        paginationHTML += `
            <li class="page-item">
                <a class="page-link" href="#" data-page="${currentPage + 1}">Следующая</a>
            </li>
        `;
    } else {
        paginationHTML += `
            <li class="page-item disabled">
                <a class="page-link" href="#">Следующая</a>
            </li>
        `;
    }
    
    //вставляем HTML пагинации
    pagination.innerHTML = paginationHTML;
    
    //добавляем обработчики событий для ссылок пагинации
    pagination.querySelectorAll('.page-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); //отменяем переход по ссылке
            const page = parseInt(link.getAttribute('data-page'));
            if (page && !link.parentElement.classList.contains('disabled')) {
                displayFunction(page); //вызываем функцию отображения
            }
        });
    });
}

// Обновление статистики в личном кабинете
/*
 * Обновляет статистику в личном кабинете
 * @param {Array} orders - Массив заявок
 */
function updateStatistics(orders) {
    //вычисляем статистику
    const activeOrders = orders.length; //количество активных заявок
    const totalHours = orders.reduce((sum, order) => sum + (order.duration || 0), 0); //сумма часов
    const totalAmount = orders.reduce((sum, order) => sum + (order.price || 0), 0); //общая стоимость
    
    //находим элементы для отображения статистики
    const activeEl = document.getElementById('active-orders');
    const hoursEl = document.getElementById('total-hours');
    const amountEl = document.getElementById('total-amount');
    
    //обновляем содержимое элементов
    if (activeEl) activeEl.textContent = activeOrders;
    if (hoursEl) hoursEl.textContent = totalHours;
    if (amountEl) amountEl.textContent = `${totalAmount} руб.`;
}