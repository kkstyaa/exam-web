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

// ================ ОБРАБОТЧИКИ СОБЫТИЙ ================

// Настройка выбора курса
function setupCourseSelection() {
    document.querySelectorAll('.select-course-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const courseId = parseInt(e.target.getAttribute('data-course-id'));
            const course = allCourses.find(c => c.id === courseId);
            
            if (course) {
                selectedCourse = course;
                selectedTutor = null;
                
                // Открываем модальное окно для курса
                openOrderModal('course', courseId);
            }
        });
    });
}

// Настройка выбора репетитора
function setupTutorSelection() {
    document.querySelectorAll('.select-tutor-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const tutorId = parseInt(e.target.getAttribute('data-tutor-id'));
            const tutor = allTutors.find(t => t.id === tutorId);
            
            if (tutor) {
                selectedTutor = tutor;
                selectedCourse = null;
                
                // Обновляем отображение репетиторов
                const tutorFilters = getTutorFilters();
                displayTutors(allTutors, tutorFilters);
                setupTutorSelection();
                
                // Открываем модальное окно для репетитора
                openOrderModal('tutor', tutorId);
            }
        });
    });
}

// Получить текущие фильтры репетиторов
function getTutorFilters() {
    return {
        language: document.getElementById('tutor-language')?.value || '',
        level: document.getElementById('tutor-level')?.value || '',
        experience: document.getElementById('tutor-experience')?.value || ''
    };
}

// Настройка фильтрации курсов
function setupCourseFilters() {
    const courseNameInput = document.getElementById('course-name');
    const courseLevelSelect = document.getElementById('course-level');
    
    if (courseNameInput && courseLevelSelect) {
        const filterCourses = () => {
            const nameFilter = courseNameInput.value.toLowerCase();
            const levelFilter = courseLevelSelect.value;
            
            let filtered = allCourses;
            
            if (nameFilter) {
                filtered = filtered.filter(course => 
                    course.name.toLowerCase().includes(nameFilter) ||
                    course.description.toLowerCase().includes(nameFilter)
                );
            }
            
            if (levelFilter) {
                filtered = filtered.filter(course => 
                    course.level.toLowerCase() === levelFilter.toLowerCase()
                );
            }
            
            displayCourses(filtered, 1);
            setupCourseSelection();
        };
        
        courseNameInput.addEventListener('input', filterCourses);
        courseLevelSelect.addEventListener('change', filterCourses);
    }
}

// Настройка фильтрации репетиторов
function setupTutorFilters() {
    const tutorLanguageInput = document.getElementById('tutor-language');
    const tutorLevelSelect = document.getElementById('tutor-level');
    const tutorExperienceInput = document.getElementById('tutor-experience');
    
    if (tutorLanguageInput && tutorLevelSelect && tutorExperienceInput) {
        const filterTutors = () => {
            const filters = {};
            
            if (tutorLanguageInput.value.trim()) {
                filters.language = tutorLanguageInput.value.trim();
            }
            
            if (tutorLevelSelect.value) {
                filters.level = tutorLevelSelect.value;
            }
            
            if (tutorExperienceInput.value) {
                filters.experience = tutorExperienceInput.value;
            }
            
            displayTutors(allTutors, filters);
            setupTutorSelection();
        };
        
        tutorLanguageInput.addEventListener('input', filterTutors);
        tutorLevelSelect.addEventListener('change', filterTutors);
        tutorExperienceInput.addEventListener('input', filterTutors);
    }
}

// Настройка действий с заявками в личном кабинете
function setupOrderActions() {
    // Просмотр заявки
    document.querySelectorAll('.view-order-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const orderId = parseInt(e.target.closest('button').getAttribute('data-order-id'));
            viewOrder(orderId);
        });
    });
    
    // Редактирование заявки
    document.querySelectorAll('.edit-order-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const orderId = parseInt(e.target.closest('button').getAttribute('data-order-id'));
            editOrder(orderId);
        });
    });
    
    // Удаление заявки
    document.querySelectorAll('.delete-order-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const orderId = parseInt(e.target.closest('button').getAttribute('data-order-id'));
            confirmDeleteOrder(orderId);
        });
    });
}

//МОДАЛЬНЫЕ ОКНА

// Открыть модальное окно заявки
/*
 * Открывает модальное окно для оформления заявки
 * @param {string} type - Тип: 'course' или 'tutor'
 * @param {number} id - ID курса или репетитора
 */
function openOrderModal(type, id) {
    const modalElement = document.getElementById('orderModal');
    if (!modalElement) return;
    
    //создаем экземпляр модального окна Bootstrap
    const modal = new bootstrap.Modal(modalElement);
    const modalTitle = modalElement.querySelector('.modal-title');
    
    if (type === 'course') {
        const course = allCourses.find(c => c.id === id);
        if (!course) return;
        
        modalTitle.textContent = 'Оформление заявки на курс';
        populateCourseForm(course); //заполняем форму данными курса
    } else if (type === 'tutor') {
        const tutor = allTutors.find(t => t.id === id);
        if (!tutor) return;
        
        modalTitle.textContent = 'Оформление заявки с репетитором';
        populateTutorForm(tutor); //заполняем форму данными репетитора
    }
    
    modal.show(); //показываем модальное окно
}

// Заполнить форму для курса
/*
 * Заполняет форму данными курса
 * @param {Object} course - Объект курса
 */
function populateCourseForm(course) {
    const form = document.getElementById('order-form');
    if (!form) return;
    
    //заполняем основные поля
    form.querySelectorAll('input')[0].value = course.name;
    form.querySelectorAll('input')[1].value = course.teacher;
    form.querySelectorAll('input')[2].value = `${course.total_length} недель`;
    
    //заполняем список дат начала курса
    const dateSelect = document.getElementById('start-date');
    dateSelect.innerHTML = '<option value="">Выберите дату</option>';
    
    course.start_dates.forEach(dateStr => {
        const date = new Date(dateStr);
        const option = document.createElement('option');
        option.value = date.toISOString().split('T')[0]; //дата в формате YYYY-MM-DD
        option.textContent = date.toLocaleDateString('ru-RU'); //дата в удобном формате
        dateSelect.appendChild(option);
    });
    
    //настройка времени при выборе даты
    dateSelect.addEventListener('change', (e) => {
        const timeSelect = document.getElementById('start-time');
        timeSelect.innerHTML = '<option value="">Выберите время</option>';
        timeSelect.disabled = !e.target.value; //блокируем, пока не выбрана дата
        
        if (e.target.value) {
            //находим соответствующее время для выбранной даты
            course.start_dates.forEach(dateStr => {
                const date = new Date(dateStr);
                if (date.toISOString().split('T')[0] === e.target.value) {
                    const time = dateStr.split('T')[1].substring(0, 5); //время в формате ЧЧ:ММ
                    const endHour = parseInt(time.split(':')[0]) + course.week_length;
                    const endTime = `${endHour.toString().padStart(2, '0')}:${time.split(':')[1]}`;
                    
                    const option = document.createElement('option');
                    option.value = time;
                    option.textContent = `${time} - ${endTime}`;
                    timeSelect.appendChild(option);
                }
            });
        }
    });
    
    //сбрасываем и настраиваем расчет стоимости
    setupCostCalculation(course, 'course');
}

// Заполнить форму для репетитора
/*
 * Заполняет форму данными репетитора
 * @param {Object} tutor - Объект репетитора
 */
function populateTutorForm(tutor) {
    const form = document.getElementById('order-form');
    if (!form) return;
    
    //заполняем основные поля
    form.querySelectorAll('input')[0].value = 'Индивидуальные занятия';
    form.querySelectorAll('input')[1].value = tutor.name;
    form.querySelectorAll('input')[2].value = '1 час'; //по умолчанию 1 час для репетитора
    
    //настраиваем выбор даты и времени
    const dateSelect = document.getElementById('start-date');
    const timeSelect = document.getElementById('start-time');
    
    dateSelect.innerHTML = '<option value="">Выберите дату</option>';
    timeSelect.innerHTML = '<option value="">Выберите время</option>';
    timeSelect.disabled = true;
    
    //добавляем ближайшие 30 дней
    const today = new Date();
    for (let i = 1; i <= 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const option = document.createElement('option');
        option.value = date.toISOString().split('T')[0];
        option.textContent = date.toLocaleDateString('ru-RU');
        dateSelect.appendChild(option);
    }
    
    //при выборе даты показываем доступное время
    dateSelect.addEventListener('change', (e) => {
        timeSelect.innerHTML = '<option value="">Выберите время</option>';
        timeSelect.disabled = !e.target.value;
        
        if (e.target.value) {
            ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'].forEach(time => {
                const option = document.createElement('option');
                option.value = time;
                option.textContent = `${time}`;
                timeSelect.appendChild(option);
            });
        }
    });
    
    //настраиваем расчет стоимости
    setupCostCalculation(tutor, 'tutor');
}

// Настройка расчета стоимости
/*
 * Настраивает расчет стоимости в зависимости от типа заявки
 * @param {Object} item - Курс или репетитор
 * @param {string} type - 'course' или 'tutor'
 */
function setupCostCalculation(item, type) {
    const calculateButton = document.getElementById('calculate-cost');
    const totalCostSpan = document.getElementById('total-cost');
    
    if (!calculateButton || !totalCostSpan) return;
    
    //удаляем старые обработчики (чтобы избежать дублирования)
    const newCalculateButton = calculateButton.cloneNode(true);
    calculateButton.parentNode.replaceChild(newCalculateButton, calculateButton);
    
    //функция расчета стоимости
    const calculate = () => {
        if (type === 'course') {
            calculateCourseCost(item);
        } else if (type === 'tutor') {
            calculateTutorCost(item);
        }
    };
    
    //назначаем обработчик на кнопку расчета
    newCalculateButton.addEventListener('click', calculate);
    
    //автоматический расчет при изменении полей
    const dateSelect = document.getElementById('start-date');
    const timeSelect = document.getElementById('start-time');
    const personsInput = document.querySelector('input[type="number"]');
    
    if (dateSelect) dateSelect.addEventListener('change', calculate);
    if (timeSelect) timeSelect.addEventListener('change', calculate);
    if (personsInput) personsInput.addEventListener('input', calculate);
    
    //расчет при изменении дополнительных опций
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', calculate);
    });
    
    //инициализируем расчет
    calculate();
}

// Расчет стоимости для курса
/*
 * Рассчитывает стоимость курса с учетом всех параметров
 * @param {Object} course - Объект курса
 */
function calculateCourseCost(course) {
    const totalCostSpan = document.getElementById('total-cost');
    const discountsDiv = document.getElementById('automatic-discounts');
    //получаем значения из формы
    const dateInput = document.getElementById('start-date').value;
    const timeInput = document.getElementById('start-time').value;
    const personsInput = document.querySelector('input[type="number"]')?.value || 1;
    const personsNumber = parseInt(personsInput);
    
    //проверяем, заполнены ли обязательные поля
    if (!dateInput || !timeInput) {
        totalCostSpan.textContent = '0';
        if (discountsDiv) {
            discountsDiv.innerHTML = '<div class="small">Выберите дату и время для расчета</div>';
        }
        return;
    }
    
    //основные параметры курса 
    const courseFeePerHour = course.course_fee_per_hour;
    const durationInHours = course.week_length * course.total_length;
    
    // Определяем множитель для выходных дней 
    const date = new Date(dateInput);
    const dayOfWeek = date.getDay();
    const isWeekendOrHoliday = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.5 : 1;
    
    //утренняя доплата
    const hour = parseInt(timeInput.split(':')[0]);
    const morningSurcharge = (hour >= 9 && hour < 12) ? 400 : 0;
    
    //вечерняя доплата
    const eveningSurcharge = (hour >= 18 && hour < 20) ? 1000 : 0;
    
    //рассчитываем базовую стоимость
    let totalCost = ((courseFeePerHour * durationInHours * isWeekendOrHoliday) + 
                    morningSurcharge + eveningSurcharge) * personsNumber;
    
    //применяем автоматические скидки
    const discounts = [];
    
    //скидка за раннюю регистрацию
    const today = new Date();
    const courseDate = new Date(dateInput);
    const monthInMs = 30 * 24 * 60 * 60 * 1000;
    
    if (courseDate - today >= monthInMs) {
        totalCost *= 0.9;
        discounts.push('Скидка за раннюю регистрацию: 10%');
    }
    
    //скидка за групповую запись
    if (personsNumber >= 5) {
        totalCost *= 0.85;
        discounts.push('Скидка за групповую запись: 15%');
    }
    
    //надбавка за интенсивный курс
    if (course.week_length >= 5) {
        totalCost *= 1.2;
        discounts.push('Интенсивный курс: +20%');
    }
    
    //применяем дополнительные опции
    const supplementary = document.getElementById('supplementary')?.checked;
    const personalized = document.getElementById('personalized')?.checked;
    const excursions = document.getElementById('excursions')?.checked;
    const assessment = document.getElementById('assessment')?.checked;
    const interactive = document.getElementById('interactive')?.checked;
    
    if (supplementary) {
        totalCost += 2000 * personsNumber; //доп материалы
    }
    
    if (personalized) {
        totalCost += 1500 * course.total_length; //инд занятия 
    }
    
    if (excursions) {
        totalCost *= 1.25; //+25% за экскурсии
    }
    
    if (assessment) {
        totalCost += 300; //оценка уровня языка 
    }
    
    if (interactive) {
        totalCost *= 1.5; //+50% за интерактивную платформу
    }
    
    //показываем примененные скидки
    if (discountsDiv) {
        if (discounts.length > 0) {
            discountsDiv.innerHTML = discounts.map(d => `<div class="small">✓ ${d}</div>`).join('');
        } else {
            discountsDiv.innerHTML = '<div class="small">Нет примененных скидок</div>';
        }
    }
    //отображаем итоговую стоимость 
    totalCostSpan.textContent = Math.round(totalCost);
}

// Расчет стоимости для репетитора
/*
 * Рассчитывает стоимость занятий с репетитором
 * @param {Object} tutor - Объект репетитора
 */
function calculateTutorCost(tutor) {
    const totalCostSpan = document.getElementById('total-cost');
    const discountsDiv = document.getElementById('automatic-discounts');
    const personsInput = document.querySelector('input[type="number"]')?.value || 1;
    const personsNumber = parseInt(personsInput);
    
    let duration = 1; //по умолчанию 1 час для репетитора
    
    //базовая стоимость
    let totalCost = tutor.price_per_hour * duration * personsNumber;
    
    //показываем, что для репетитора нет автоматических скидок
    if (discountsDiv) {
        discountsDiv.innerHTML = '<div class="small">Для индивидуальных занятий скидки не применяются</div>';
    }
    
    totalCostSpan.textContent = Math.round(totalCost);
}

// Настройка отправки заявки
function setupOrderForm() {
    const submitButton = document.getElementById('submit-order');
    if (!submitButton) return;
    
    const modalElement = document.getElementById('orderModal');
    if (!modalElement) return;
    
    //удаляем старый обработчик и создаем новый (чтобы избежать дублирования)
    const newSubmitButton = submitButton.cloneNode(true);
    submitButton.parentNode.replaceChild(newSubmitButton, submitButton);
    
    //обработчик отправки формы
    newSubmitButton.addEventListener('click', async () => {
        try {
            //получаем данные из формы
            const dateStart = document.getElementById('start-date').value;
            const timeStart = document.getElementById('start-time').value;
            const persons = document.querySelector('input[type="number"]')?.value || 1;
            const totalCost = document.getElementById('total-cost').textContent;
            
            //проверяем заполнение обязательных полей
            if (!dateStart || !timeStart) {
                showNotification('Заполните все обязательные поля', 'warning');
                return;
            }
            
            //формируем объект с данными заявки
            const orderData = {
                date_start: dateStart,
                time_start: timeStart,
                persons: parseInt(persons),
                price: parseInt(totalCost),
                early_registration: false,
                group_enrollment: parseInt(persons) >= 5,
                intensive_course: false,
                supplementary: document.getElementById('supplementary')?.checked || false,
                personalized: document.getElementById('personalized')?.checked || false,
                excursions: document.getElementById('excursions')?.checked || false,
                assessment: document.getElementById('assessment')?.checked || false,
                interactive: document.getElementById('interactive')?.checked || false
            };
            
            //добавляем ID курса или репетитора
            if (selectedCourse) {
                orderData.course_id = selectedCourse.id;
                orderData.duration = selectedCourse.week_length * selectedCourse.total_length;
                orderData.intensive_course = selectedCourse.week_length >= 5;
                
                //определяем раннюю регистрацию
                const today = new Date();
                const courseDate = new Date(dateStart);
                const monthInMs = 30 * 24 * 60 * 60 * 1000;
                orderData.early_registration = (courseDate - today >= monthInMs);
                
            } else if (selectedTutor) {
                orderData.tutor_id = selectedTutor.id;
                orderData.duration = 1;
            } else {
                showNotification('Не выбран курс или репетитор', 'warning');
                return;
            }
            
            //создаем заявку на сервере
            await createOrder(orderData);
            
            //закрываем модальное окно
            const modal = bootstrap.Modal.getInstance(modalElement);
            modal.hide();
            
            //сбрасываем выбранные элементы
            selectedCourse = null;
            selectedTutor = null;
            
            //если мы на странице личного кабинета, обновляем список заявок
            if (document.getElementById('orders-table')) {
                const orders = await fetchOrders();
                displayOrders(orders, currentPageOrders);
            }
            
        } catch (error) {
            //ошибка уже обработана в createOrder
        }
    });
    
    //сброс формы при закрытии модального окна
    modalElement.addEventListener('hidden.bs.modal', () => {
        document.getElementById('order-form')?.reset();
        selectedCourse = null;
        selectedTutor = null;
        
        //сбрасываем выделение репетиторов
        const tutorFilters = getTutorFilters();
        displayTutors(allTutors, tutorFilters);
        setupTutorSelection();
    });
}

// Просмотр заявки
/*
 * Просмотр деталей заявки
 * @param {number} orderId - ID заявки
 */
async function viewOrder(orderId) {
    try {
        //загружаем данные заявки с сервера
        const url = addApiKey(API_BASE_URL + `api/orders/${orderId}`);
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Ошибка при загрузке заявки');
        }
        
        const order = await response.json();
        
        //заполняем модальное окно данными
        document.getElementById('order-id').textContent = order.id;
        document.getElementById('order-type').textContent = order.course_id ? 'Курс' : 'Репетитор';
        document.getElementById('order-name').textContent = order.course_id ? 
            (allCourses.find(c => c.id === order.course_id)?.name || 'Курс') :
            (allTutors.find(t => t.id === order.tutor_id)?.name || 'Репетитор');
        document.getElementById('order-start-date').textContent = formatDate(order.date_start);
        document.getElementById('order-time').textContent = formatTime(order.time_start);
        document.getElementById('order-duration').textContent = order.duration || 1;
        document.getElementById('order-persons').textContent = order.persons;
        document.getElementById('order-price').textContent = order.price;
        document.getElementById('order-created').textContent = formatDate(order.created_at);
        
        //показываем выбранные опции
        const optionsDiv = document.getElementById('order-options');
        const options = [];
        
        if (order.supplementary) options.push('Дополнительные материалы');
        if (order.personalized) options.push('Индивидуальные занятия');
        if (order.excursions) options.push('Культурные экскурсии');
        if (order.assessment) options.push('Оценка уровня');
        if (order.interactive) options.push('Интерактивная платформа');
        
        optionsDiv.innerHTML = options.length > 0 ? 
            options.map(opt => `<span class="badge bg-info me-1">${opt}</span>`).join('') :
            'Нет дополнительных опций';
        
        //показываем примененные скидки
        const discountsDiv = document.getElementById('order-discounts');
        const discounts = [];
        
        if (order.early_registration) discounts.push('Скидка за раннюю регистрацию: 10%');
        if (order.group_enrollment) discounts.push('Скидка за групповую запись: 15%');
        if (order.intensive_course) discounts.push('Интенсивный курс: +20%');
        
        discountsDiv.innerHTML = discounts.length > 0 ? 
            discounts.map(d => `<div class="small">✓ ${d}</div>`).join('') :
            '<p class="mb-0">Нет примененных скидок</p>';
        
        //показываем модальное окно
        const modal = new bootstrap.Modal(document.getElementById('viewOrderModal'));
        modal.show();
        
    } catch (error) {
        console.error('Ошибка при просмотре заявки:', error);
        showNotification('Ошибка при загрузке заявки', 'error');
    }
}

// Редактирование заявки
/*
 * Редактирование заявки
 * @param {number} orderId - ID заявки
 */
async function editOrder(orderId) {
    try {
        //загружаем данные заявки
        const url = addApiKey(API_BASE_URL + `api/orders/${orderId}`);
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Ошибка при загрузке заявки для редактирования');
        }
        
        const order = await response.json();
        
        //открываем модальное окно заявки с данными для редактирования
        if (order.course_id) {
            const course = allCourses.find(c => c.id === order.course_id);
            if (course) {
                selectedCourse = course;
                openOrderModal('course', course.id);
                
                //устанавливаем значения полей
                setTimeout(() => {
                    document.getElementById('start-date').value = order.date_start;
                    document.getElementById('start-time').value = order.time_start;
                    document.querySelector('input[type="number"]').value = order.persons;
                    
                    //устанавливаем чекбоксы
                    document.getElementById('supplementary').checked = order.supplementary;
                    document.getElementById('personalized').checked = order.personalized;
                    document.getElementById('excursions').checked = order.excursions;
                    document.getElementById('assessment').checked = order.assessment;
                    document.getElementById('interactive').checked = order.interactive;
                    
                    //переименовываем кнопку отправки
                    document.querySelector('#submit-order').textContent = 'Сохранить изменения';
                    
                    //сохраняем ID заявки для обновления
                    const submitBtn = document.getElementById('submit-order');
                    submitBtn.dataset.orderId = orderId;
                    submitBtn.dataset.mode = 'edit';
                }, 500);
            }
        } else if (order.tutor_id) {
            const tutor = allTutors.find(t => t.id === order.tutor_id);
            if (tutor) {
                selectedTutor = tutor;
                openOrderModal('tutor', tutor.id);
                
                //устанавливаем значения полей формы
                setTimeout(() => {
                    document.getElementById('start-date').value = order.date_start;
                    document.getElementById('start-time').value = order.time_start;
                    document.querySelector('input[type="number"]').value = order.persons;
                    
                    //переименовываем кнопку отправки
                    document.querySelector('#submit-order').textContent = 'Сохранить изменения';
                    
                    //сохраняем ID заявки для обновления
                    const submitBtn = document.getElementById('submit-order');
                    submitBtn.dataset.orderId = orderId;
                    submitBtn.dataset.mode = 'edit';
                }, 500);
            }
        }
        
    } catch (error) {
        console.error('Ошибка при редактировании заявки:', error);
        showNotification('Ошибка при загрузке заявки', 'error');
    }
}

// Подтверждение удаления заявки
/*
 * Подтверждение удаления заявки
 * @param {number} orderId - ID заявки
 */
function confirmDeleteOrder(orderId) {
    //устанавливаем ID в модальном окне подтверждения
    document.getElementById('delete-order-id').textContent = orderId;
    
    //показываем модальное окно
    const modal = new bootstrap.Modal(document.getElementById('deleteOrderModal'));
    modal.show();
    
    //настройка кнопки подтверждения удаления
    const confirmBtn = document.getElementById('confirm-delete');
    confirmBtn.onclick = async () => {
        try {
            //удаляем заявку с сервера
            await deleteOrder(orderId);
            showNotification('Заявка успешно удалена!', 'success');
            
            //удаляем из массива и обновляем отображение
            allOrders = allOrders.filter(order => order.id !== orderId);
            displayOrders(allOrders, currentPageOrders);
            
            modal.hide(); //закрываем окно
        } catch (error) {
            showNotification(`Ошибка при удалении: ${error.message}`, 'error');
        }
    };
}

//ИНИЦИАЛИЗАЦИЯ

//инициализация главной страницы
async function initMainPage() {
    //проверяем наличие API ключа
    if (!apiKey) {
        showNotification('Введите API ключ для работы с системой', 'warning');
        return;
    }
    
    //загружаем данные с сервера
    try {
        const [courses, tutors] = await Promise.all([
            fetchCourses(),
            fetchTutors()
        ]);
        
        //отображаем данные
        displayCourses(courses, currentPageCourses);
        displayTutors(tutors);
        
        //настраиваем фильтры
        setupCourseFilters();
        setupTutorFilters();
        
        //настраиваем обработчики событий
        setupCourseSelection();
        setupTutorSelection();
        setupOrderForm();
        
    } catch (error) {
        console.error('Ошибка при инициализации главной страницы:', error);
    }
}

// Инициализация личного кабинета
async function initPersonalPage() {
    //проверяем наличие API ключа
    if (!apiKey) {
        showNotification('Введите API ключ для работы с системой', 'warning');
        return;
    }
    
    try {
        //загружаем заявки
        const orders = await fetchOrders();
        
        //загружаем курсы и репетиторов для отображения названий
        await Promise.all([
            fetchCourses(),
            fetchTutors()
        ]);
        
        //отображаем заявки
        displayOrders(orders, currentPageOrders);
        
        //настраиваем делегирование событий для динамических элементов
        document.getElementById('orders-body')?.addEventListener('click', (e) => {
            if (e.target.closest('.view-order-btn')) {
                const orderId = e.target.closest('.view-order-btn').dataset.orderId;
                viewOrder(orderId);
            } else if (e.target.closest('.edit-order-btn')) {
                const orderId = e.target.closest('.edit-order-btn').dataset.orderId;
                editOrder(orderId);
            } else if (e.target.closest('.delete-order-btn')) {
                const orderId = e.target.closest('.delete-order-btn').dataset.orderId;
                confirmDeleteOrder(orderId);
            }
        });
        
    } catch (error) {
        console.error('Ошибка при инициализации личного кабинета:', error);
    }
}

//ЗАПУСК ПРИ ЗАГРУЗКЕ СТРАНИЦЫ
document.addEventListener('DOMContentLoaded', function() {
    //проверяем на какой странице мы находимся
    if (document.getElementById('courses-table')) {
        //главная страница
        initMainPage();
    } else if (document.getElementById('orders-table')) {
        //личный кабинет
        initPersonalPage();
    }
    
    //общий код для обеих страниц
    document.body.addEventListener('click', function(e) {
        //обработка кнопки "Записаться на курс" на главной странице
        if (e.target.closest('[data-bs-target="#orderModal"]') && !selectedCourse && !selectedTutor) {
            e.preventDefault();
            showNotification('Сначала выберите курс или репетитора', 'warning');
        }
    });
});