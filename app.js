// Консультант ЭЛТИ-КУДИЦ - Главный файл приложения

class ChatBot {
    constructor() {
        this.database = [];
        this.chatMessages = document.getElementById('chatMessages');
        this.userInput = document.getElementById('userInput');
        this.sendButton = document.getElementById('sendButton');
        this.loadingIndicator = document.getElementById('loadingIndicator');
        
        this.init();
    }

    async init() {
        // Загрузка базы данных
        await this.loadDatabase();
        
        // Установка обработчиков событий
        this.setupEventListeners();
        
        // Фокус на поле ввода
        this.userInput.focus();
    }

    async loadDatabase() {
        try {
            const response = await fetch('data/baza_ivan_full.json');
            if (!response.ok) {
                throw new Error('Не удалось загрузить базу данных');
            }
            this.database = await response.json();
            console.log(`База данных загружена: ${this.database.length} записей`);
            this.hideLoading();
        } catch (error) {
            console.error('Ошибка загрузки базы данных:', error);
            this.hideLoading();
            this.addBotMessage('Извините, произошла ошибка при загрузке базы данных. Пожалуйста, обновите страницу.');
        }
    }

    setupEventListeners() {
        // Отправка по кнопке
        this.sendButton.addEventListener('click', () => this.handleUserMessage());
        
        // Отправка по Enter
        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleUserMessage();
            }
        });

        // Обработка кликов по элементам с кодами
        this.chatMessages.addEventListener('click', (e) => {
            if (e.target.classList.contains('code-item') || e.target.closest('.code-item')) {
                const codeItem = e.target.classList.contains('code-item') ? e.target : e.target.closest('.code-item');
                const code = codeItem.dataset.code;
                if (code) {
                    this.userInput.value = code;
                    this.handleUserMessage();
                }
            }
        });
    }

    handleUserMessage() {
        const message = this.userInput.value.trim();
        
        if (!message) {
            return;
        }

        // Добавляем сообщение пользователя
        this.addUserMessage(message);
        
        // Очищаем поле ввода
        this.userInput.value = '';
        
        // Показываем индикатор "печатает"
        this.showTypingIndicator();
        
        // Обрабатываем сообщение
        setTimeout(() => {
            this.processUserMessage(message);
            this.hideTypingIndicator();
        }, 500);
    }

    processUserMessage(message) {
        // Проверяем, является ли сообщение кодом
        const isCode = this.looksLikeCode(message);
        
        if (isCode) {
            this.searchByCode(message);
        } else {
            this.handleTextQuery(message);
        }
    }

    looksLikeCode(text) {
        // Проверяем, похоже ли на код (содержит точки и цифры)
        return /^\d+(\.\d+)*\.?$/.test(text.trim());
    }

    searchByCode(code) {
        // Нормализуем код (удаляем лишние пробелы)
        code = code.trim();
        
        // 1. Поиск точного совпадения
        const exactMatch = this.database.find(item => item['Код'] === code);
        
        if (exactMatch) {
            this.displayExactMatch(exactMatch);
            return;
        }
        
        // 2. Поиск частичных совпадений
        const partialMatches = this.database.filter(item => 
            item['Код'].startsWith(code) && item['Код'] !== code
        );
        
        if (partialMatches.length > 0) {
            this.displayPartialMatches(code, partialMatches);
            return;
        }
        
        // 3. Поиск по началу (первые 2-3 сегмента)
        const segments = code.split('.');
        if (segments.length > 1) {
            const baseCode = segments.slice(0, -1).join('.');
            const similarCodes = this.database.filter(item => 
                item['Код'].startsWith(baseCode)
            );
            
            if (similarCodes.length > 0) {
                this.displaySimilarCodes(code, similarCodes);
                return;
            }
        }
        
        // 4. Ничего не найдено
        this.displayNoResults(code);
    }

    displayExactMatch(item) {
        const hasArticle = item['Арт'] && item['Арт'].trim() !== '';
        
        let message = `<div class="product-card">
            <div class="product-header">
                <div class="product-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 11L12 14L22 4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <div class="product-title">
                    <div class="product-code">Код: ${this.escapeHtml(item['Код'])}</div>
                    <div class="product-name">${this.escapeHtml(item['По1057'])}</div>
                </div>
            </div>
            <div class="product-divider"></div>
            <div class="product-details">`;
        
        if (hasArticle) {
            message += `
                <div class="product-row">
                    <div class="product-label">Артикул:</div>
                    <div class="product-value product-article">${this.escapeHtml(item['Арт'])}</div>
                </div>`;
            
            if (item['ПоЭл'] && item['ПоЭл'].trim() !== '') {
                message += `
                <div class="product-row">
                    <div class="product-label">Наименование:</div>
                    <div class="product-value">${this.escapeHtml(item['ПоЭл'])}</div>
                </div>`;
            }
            
            message += `
            </div>
            <div class="product-availability">
                ✅ Данный продукт доступен для заказа на нашем сайте <strong>vdm.ru</strong> по артикулу <strong>${this.escapeHtml(item['Арт'])}</strong>
            </div>`;
        } else {
            message += `
            </div>
            <div class="product-availability product-unavailable">
                ⚠️ К сожалению, в нашем каталоге пока нет соответствующей позиции. Мы работаем над этим.
            </div>`;
        }
        
        message += `</div>`;
        
        // Добавляем дополнительное сообщение
        message += `<p style="margin-top: 12px;">Могу ли я помочь вам с чем-то ещё?</p>`;
        
        this.addBotMessage(message);
    }

    displayPartialMatches(searchCode, matches) {
        let message = `<p>По коду <code>${this.escapeHtml(searchCode)}</code> найдено точное совпадение не было.</p>`;
        message += `<p>Вот похожие позиции, которые начинаются с этого кода:</p>`;
        message += `<div class="code-list">`;
        
        // Ограничиваем до 10 результатов
        const limitedMatches = matches.slice(0, 10);
        
        limitedMatches.forEach(item => {
            message += `
                <div class="code-item" data-code="${this.escapeHtml(item['Код'])}">
                    <div class="code-item-code">${this.escapeHtml(item['Код'])}</div>
                    <div class="code-item-name">${this.escapeHtml(item['По1057'])}</div>
                </div>`;
        });
        
        message += `</div>`;
        
        if (matches.length > 10) {
            message += `<p style="margin-top: 8px; font-size: 13px; color: var(--text-secondary);">Показано 10 из ${matches.length} результатов. Уточните код для более точного поиска.</p>`;
        }
        
        message += `<p style="margin-top: 12px;">Нажмите на интересующую позицию, чтобы увидеть подробную информацию.</p>`;
        
        this.addBotMessage(message);
    }

    displaySimilarCodes(searchCode, matches) {
        let message = `<p>По коду <code>${this.escapeHtml(searchCode)}</code> точного совпадения не найдено.</p>`;
        message += `<p>Возможно, вас заинтересуют эти позиции:</p>`;
        message += `<div class="code-list">`;
        
        // Ограничиваем до 10 результатов
        const limitedMatches = matches.slice(0, 10);
        
        limitedMatches.forEach(item => {
            message += `
                <div class="code-item" data-code="${this.escapeHtml(item['Код'])}">
                    <div class="code-item-code">${this.escapeHtml(item['Код'])}</div>
                    <div class="code-item-name">${this.escapeHtml(item['По1057'])}</div>
                </div>`;
        });
        
        message += `</div>`;
        
        if (matches.length > 10) {
            message += `<p style="margin-top: 8px; font-size: 13px; color: var(--text-secondary);">Показано 10 из ${matches.length} результатов.</p>`;
        }
        
        message += `<p style="margin-top: 12px;">Нажмите на интересующую позицию, чтобы увидеть подробную информацию.</p>`;
        
        this.addBotMessage(message);
    }

    displayNoResults(searchCode) {
        let message = `<p>По коду <code>${this.escapeHtml(searchCode)}</code> не найдено совпадений в нашей базе данных.</p>`;
        message += `<p>Пожалуйста:</p>`;
        message += `<ul>`;
        message += `<li>Проверьте правильность введённого кода</li>`;
        message += `<li>Попробуйте ввести код из меньшего количества сегментов (например, <code>1.2</code> вместо <code>1.2.99</code>)</li>`;
        message += `<li>Опишите интересующий товар словами (назначение, характеристики)</li>`;
        message += `</ul>`;
        
        this.addBotMessage(message);
    }

    handleTextQuery(query) {
        // Поиск по тексту в наименованиях
        const queryLower = query.toLowerCase();
        
        // Разбиваем запрос на слова
        const keywords = queryLower.split(/\s+/).filter(word => word.length > 2);
        
        if (keywords.length === 0) {
            this.addBotMessage(`
                <p>Пожалуйста, опишите более подробно, что вас интересует:</p>
                <ul>
                    <li>Назначение товара</li>
                    <li>Основные характеристики</li>
                    <li>Область применения</li>
                </ul>
                <p>Или введите код позиции из Приказа 1057 (например: <code>1.2.5</code>)</p>
            `);
            return;
        }
        
        // Ищем товары, содержащие ключевые слова
        const matches = this.database.filter(item => {
            const itemText = (item['По1057'] + ' ' + item['ПоЭл']).toLowerCase();
            return keywords.some(keyword => itemText.includes(keyword));
        });
        
        if (matches.length > 0) {
            let message = `<p>По вашему запросу "<strong>${this.escapeHtml(query)}</strong>" найдены следующие позиции:</p>`;
            message += `<div class="code-list">`;
            
            // Ограничиваем до 15 результатов
            const limitedMatches = matches.slice(0, 15);
            
            limitedMatches.forEach(item => {
                message += `
                    <div class="code-item" data-code="${this.escapeHtml(item['Код'])}">
                        <div class="code-item-code">${this.escapeHtml(item['Код'])}</div>
                        <div class="code-item-name">${this.escapeHtml(item['По1057'])}</div>
                    </div>`;
            });
            
            message += `</div>`;
            
            if (matches.length > 15) {
                message += `<p style="margin-top: 8px; font-size: 13px; color: var(--text-secondary);">Показано 15 из ${matches.length} результатов. Уточните запрос для более точного поиска.</p>`;
            }
            
            message += `<p style="margin-top: 12px;">Нажмите на интересующую позицию, чтобы увидеть подробную информацию.</p>`;
            
            this.addBotMessage(message);
        } else {
            this.addBotMessage(`
                <p>К сожалению, по запросу "<strong>${this.escapeHtml(query)}</strong>" ничего не найдено.</p>
                <p>Попробуйте:</p>
                <ul>
                    <li>Использовать другие ключевые слова</li>
                    <li>Ввести код позиции из Приказа 1057 (например: <code>1.2.5</code>)</li>
                    <li>Описать товар более общими словами</li>
                </ul>
                <p>Я помогу вам найти нужную продукцию!</p>
            `);
        }
    }

    addUserMessage(text) {
        const messageHtml = `
            <div class="message user-message">
                <div class="message-content">
                    <div class="message-bubble">
                        <p>${this.escapeHtml(text)}</p>
                    </div>
                    <div class="message-time">${this.getCurrentTime()}</div>
                </div>
                <div class="message-avatar">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="16" cy="16" r="16" fill="white"/>
                        <path d="M16 16C18.2091 16 20 14.2091 20 12C20 9.79086 18.2091 8 16 8C13.7909 8 12 9.79086 12 12C12 14.2091 13.7909 16 16 16Z" fill="#2563eb"/>
                        <path d="M16 18C12.6863 18 10 20.6863 10 24H22C22 20.6863 19.3137 18 16 18Z" fill="#2563eb"/>
                    </svg>
                </div>
            </div>
        `;
        
        this.chatMessages.insertAdjacentHTML('beforeend', messageHtml);
        this.scrollToBottom();
    }

    addBotMessage(html) {
        const messageHtml = `
            <div class="message bot-message">
                <div class="message-avatar">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="16" cy="16" r="16" fill="#2563eb"/>
                        <path d="M10 16L14 20L22 11" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <div class="message-content">
                    <div class="message-bubble">
                        ${html}
                    </div>
                    <div class="message-time">${this.getCurrentTime()}</div>
                </div>
            </div>
        `;
        
        this.chatMessages.insertAdjacentHTML('beforeend', messageHtml);
        this.scrollToBottom();
    }

    showTypingIndicator() {
        const indicatorHtml = `
            <div class="message bot-message typing-message">
                <div class="message-avatar">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="16" cy="16" r="16" fill="#2563eb"/>
                        <path d="M10 16L14 20L22 11" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <div class="message-content">
                    <div class="message-bubble">
                        <div class="typing-indicator">
                            <div class="typing-dot"></div>
                            <div class="typing-dot"></div>
                            <div class="typing-dot"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.chatMessages.insertAdjacentHTML('beforeend', indicatorHtml);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const typingMessage = this.chatMessages.querySelector('.typing-message');
        if (typingMessage) {
            typingMessage.remove();
        }
    }

    scrollToBottom() {
        setTimeout(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }, 100);
    }

    getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    hideLoading() {
        this.loadingIndicator.classList.add('hidden');
    }
}

// Инициализация приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    const chatBot = new ChatBot();
});