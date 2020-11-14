'use strict';
(function () {
    /*
     * Расширения
     */
    Array.prototype.remove = function (...args) {
        let
            what,
            l = args.length, ax;
        while (l && this.length) {
            what = args[--l];
            while ((ax = this.indexOf(what)) !== -1) {
                this.splice(ax, 1);
            }
        }
        return this;
    };

    Object.size = function (obj) {
        let
            size = 0,
            key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) size++;
        }
        return size;
    };

    Object.clone = function (obj) {
        let clone;
        if (Object.prototype.toString.call(obj) === '[object Array]') {
            clone = [];
            for (let i = 0; i < obj.length; i++) {
                clone[i] = Object.clone(obj[i]);
            }

            return clone;
        } else if (typeof (obj) == "object") {
            clone = {};
            for (let prop in obj)
                if (obj.hasOwnProperty(prop))
                    clone[prop] = Object.clone(obj[prop]);

            return clone;
        } else
            return obj;
    }

    /**
     * Уникальное ИД
     * @type {function(): string}
     */
    const uid = (function _uid(scope) {
        let count = {};
        if (!count[scope]) {
            count[scope] = 0;
        }
        return function () {
            return count[scope]++;
        };
    })();

    function deepCopy(target, copy) {
        copy = target.constructor();
        for (let key in target) {
            if (!target.hasOwnProperty(key)) {
                continue;
            }
            if (typeof target[key] == "object") {
                copy[key] = deepCopy(target[key]);
            } else {
                copy[key] = target[key];
            }
        }
        return this;
    }

    /**
     * Main Elementalist
     */
    class El {
        version = 3.0;
        el;
        element;
        animate;

        /**
         * Class by DOM elements
         * @param element {string|object|null|El}
         * @returns {[]|undefined|El}
         */
        constructor(element) {
            if (typeof element == 'undefined' || element == null) {
                this.element = document.body;
            } else if (element instanceof El) {
                return element;
            } else if (typeof element == 'string') {
                let
                    idPattern = /^(?:#([\w-]*))$/,
                    searchId = idPattern.exec(element),
                    classPattern = /^(?:\.([\w-]*))$/,
                    searchClass = classPattern.exec(element);
                if (searchId && searchId[1]) {
                    this.element = document.getElementById(searchId[1]);
                } else if (searchClass && searchClass[1]) {
                    let
                        result = [],
                        _els = document.getElementsByClassName(searchClass[1]);
                    if (_els instanceof Array) {
                        _els.forEach((e) => {
                            result.push(El.New(e));
                        });
                    }
                    return result;
                } else {
                    this.element = document.createElement(element);
                }
            } else if (typeof element === 'object') {
                if (element instanceof El) {
                    this.element = element['element'];
                } else {
                    this.element = element;
                }
            } else {
                return undefined;
            }
            this[0] = this.el = this.element;
        }

        /**
         * Return this inner DOM element is correct
         * @returns {boolean}
         */
        isNull() {
            return this.element == null || this.element === '';
        }

        /**
         * Check by struct is correct
         * @returns {boolean}
         */
        correct() {
            return !this.isNull();
        }

        /**
         * Get id of element
         * @returns {*|undefined|string|null}
         */
        id() {
            if (this.correct()) {
                return this.element.getAttribute('id');
            }
            return null;
        };

        /**
         * Get check state of checkbox
         * TODO: add check by type of checkbox or radio
         * @returns {null|(function(): (*|null))|(function(): El.el.checked)|boolean}
         */
        checked() {
            if (this.correct()) {
                return this.element.checked;
            }
            return null;
        }

        /**
         * Алиас: html
         * @param text
         */
        text(text) {
            return this.html(text);
        }

        /**
         *
         * @param insert {null|string}
         * @param add {boolean}
         * @param pre {boolean}
         * @returns {string|string|null|El}
         */
        html(insert = null, add = false, pre = false) {
            if (this.isNull()) {
                return null;
            }
            if (insert == null) {
                return this.element.html || this.element.innerHTML || this.element.value || this.element.text || '';
            }

            if (typeof insert === 'object') {
                if (insert instanceof El) {
                    insert = insert['element'];
                }
                if (!add) {
                    this.element.innerHTML = '';
                }
                if (pre) {
                    this.element.insertBefore(insert, this.element.firstChild);
                } else {
                    this.element.appendChild(insert);
                }
            } else { //добавляем строки
                if (add) {
                    if (pre) {
                        let tmp = this.element.innerHTML || '';
                        this.element.innerHTML = insert + tmp;
                    } else
                        this.element.innerHTML += insert;
                } else
                    this.element.innerHTML = insert;
            }
            return this;
        };

        /**
         *
         * @param value {null|string}
         * @param add {boolean|null}
         * @param pre {boolean|null}
         * @returns {string|string|null|El}
         */
        value(value = null, add = false, pre = false) {
            if (this.isNull()) {
                return null;
            }
            let
                type = this.element.type,
                allow = [
                    'text',
                    'password',
                    'checkbox',
                    'radio',
                    'file'
                ]
            ;
            if (allow.includes(type)) {
                return null;
            }
            if (value == null) {
                return this.element.value;
            }
            if (add) {
                if (pre) {
                    let tmp = this.element.value;
                    this.element.value = value;
                    this.element.value += tmp;
                } else {
                    this.element.value += value;
                }
            } else {
                this.element.value = value;
            }
            return this;
        }

        /**
         *
         * @returns {(function((null|string)=, boolean=, boolean=): (string|null|El))|(function((null|string), boolean, boolean): (string|El|null))|(function(*): string)|string|string|*}
         */
        getHtml() {
            return this.element.html || this.element.innerHTML || this.element.value || this.element.text || '';
        }

        /**
         * Работа с ListBox`ами или DataList`ами
         * [{"groups":[{"name":"Group_0","args":[{"type":"list","list":["1","2","3","4","5"],"name":"List_0"}]}]}]
         * @returns {null|{getValue: (function(): *), foreach: foreach, getSelect: (function(): *), getIndex: (function(): *), addOption: (function(string, string, *=): (string|null|El)), setSelect: setSelect, getText: (function(): *), setSelectByValue: (function(string): (string|boolean)), clearOptions: clearOptions, addOptions: addOptions}}
         */
        select() {
            if (this.isNull()) {
                return null;
            }
            const _this = this;
            return {
                /**
                 *
                 * @param opt {number}
                 */
                setSelect: function (opt) {
                    _this.element.options[opt].selected = true;
                    if (_this.element.tagName === 'DATALIST') {
                        let inputs = _this.element.parentElement.getElementsByTagName('input');
                        inputs = Array.from(inputs);
                        inputs.forEach(input => {
                            let list = input.getAttribute('list');
                            if (list === _this.id()) {
                                input.value = _this.element.options[opt].value;
                            }
                        });
                    }
                },
                /**
                 *
                 * @param val {string}
                 * @returns {string|boolean}
                 */
                setSelectByValue: function (val) {
                    let
                        i = 0,
                        options = Array.from(_this.element.options),
                        res = false;
                    options.some(select => {
                        if (select.value === val) {
                            this.setSelect(i);
                            res = true;
                            return res;
                        }
                        i++;
                    });
                    return res;
                },
                getSelect: function () {
                    return _this.element.options[this.getIndex()];
                },
                getIndex: function () {
                    return _this.element.selectedIndex;
                },
                getValue: function () {
                    return this.getSelect().value;
                },
                getText: function () {
                    return this.getSelect().text;
                },
                clearOptions: function () {
                    _this.html('');
                },
                /**
                 *
                 * @param value {null|string}
                 * @param text {string}
                 * @param select
                 * @returns {string|null|El}
                 */
                addOption: function (value, text, select = false) {
                    let attr = {
                        value: value,
                    };
                    if (select) {
                        attr = Object.assign(attr, {
                            selected: 'selected'
                        });
                    }
                    return El.New('option').attr(attr).html(text).insert(_this.el);
                },
                /**
                 *
                 * @param options {object}
                 */
                addOptions: function (options) {
                    for (let data in options) {
                        if (!options.hasOwnProperty(data)) {
                            continue;
                        }
                        this.addOption(data, options[data]);
                    }
                },
                values: function () {
                    let result = [];
                    Array.from(_this.element.options).forEach(option => {
                        result.push(option.value);
                    });
                    return result;
                },
                foreach: function (cb) {
                    let options = Array.from(_this.element.options);
                    options.forEach(select => {
                        cb.call(this, select);
                    })
                }
            }
        }

        /**
         *  Добавить аттрибуты / получить аттрибут
         * @param attribute {null|string|object}
         * @returns {*|undefined|string|El}
         */
        attr(attribute = null) { //добавим элементу аттрибуты
            if (this.isNull()) {
                return undefined;
            }
            if (attribute == null) {
                let _this = this;
                return {
                    /**
                     *
                     * @param attribute
                     * @returns {El}
                     */
                    del: function (attribute) {
                        _this.element.removeAttribute(attribute);
                        return _this;
                    },
                    /**
                     *
                     * @param attribute
                     * @returns {boolean}
                     */
                    has: function (attribute) {
                        return _this.element.hasAttribute(attribute);
                    },
                    /**
                     *
                     * @param attributes
                     * @returns {El}
                     */
                    set: function (attributes) {
                        for (let k in attributes) {
                            if (!attributes.hasOwnProperty(k)) {
                                continue;
                            }
                            if (El.#isEmpty(attributes[k]) && k !== 'disabled' && k !== 'checked') {
                                _this.attr().del(attributes[k]);
                            } else {
                                _this.element.setAttribute(k, attributes[k]);
                            }
                        }
                        return _this;
                    },
                    /**
                     * Получить аттрибут
                     * @param attribute {string}
                     * @returns {*|undefined|string}
                     */
                    get: function (attribute) {
                        return _this.element.getAttribute(attribute);
                    }
                }
            } else if (typeof attribute === 'object') {
                return this.attr().set(attribute);
            } else if (typeof attribute === 'string') {
                return this.attr().get(attribute);
            }
        };

        /**
         * Удалить аттрибут
         * @param attribute {string}
         * @returns {El}
         */
        attrDel(attribute) {
            return this.attr().del(attribute);
        };

        /**
         *  Аттрибут существует
         * @param attribute {string}
         * @returns {boolean}
         */
        attrHas(attribute) {
            return this.attr().has(attribute);
        };

        /**
         *
         * @param c
         * @returns {El|{add: (function(*=): (El)), isSet: (function(string): boolean), get: (function(): *), clear: (function(): El), replace: (function(string, string): El), del: (function(*=): El)}}
         */
        class(c = null) {
            if (El.#isEmpty(c)) {
                let
                    _this = this,
                    /**
                     *
                     * @param className
                     * @returns {RegExp}
                     */
                    re = (className) => {
                        return new RegExp("(^|\\s)" + className + "(\\s|$)", "g")
                    };
                return {
                    get: function () {
                        return _this.element.className
                    },
                    add: function (className) {
                        if (re(className).test(_this.element.className)) {
                            return _this;
                        }
                        _this.element.className = (_this.element.className + " " + className).replace(/\s+/g, " ").replace(/(^ | $)/g, "");
                        return _this;
                    },
                    del: function (className) {
                        _this.element.className = _this.element.className.replace(re(className), "$1").replace(/\s+/g, " ").replace(/(^ | $)/g, "");
                        return _this;
                    },
                    clear: function () {
                        _this.element.className = '';
                        return _this;
                    },
                    /**
                     * Заменить класс
                     * @param search {string}
                     * @param replace {string}
                     * @returns {El}
                     */
                    replace: function (search, replace) {
                        _this.class().del(search);
                        _this.class().add(replace);
                        return _this;
                    },
                    /**
                     * Класс существует
                     * @param className {string}
                     * @returns {boolean}
                     */
                    isSet: function (className) {
                        return re(className).test(_this.el.className);
                    }
                };
            } else {
                this.element.className = c;
                return this;
            }
        };

        /**
         * Алиас: Получить класс
         * @returns {null|string}
         */
        getClass() {
            return this.class().get();
        };

        /**
         * Алиас: добавить классы или классы
         * @param className {string}
         * @returns {El}
         */
        addClass(className) {
            return this.class().add(className);
        };

        /**
         * Алиас: удалить класс
         * @param className {string}
         * @returns {El}
         */
        rmClass(className) {
            return this.class().del(className);
        };

        /**
         * Алиас: Удалить класс / все классы
         * @returns {El}
         */
        clearClass() {
            return this.class().clear();
        };

        /**
         * Алиас: сменить класс (совместимость)
         * @param needle {string}
         * @param replace {string}
         * @returns {El}
         */
        replClass(needle, replace) {
            return this.class().replace(needle, replace);
        };

        /**
         * Алиас: наличие класса
         * @param className {string}
         * @returns {boolean}
         */
        isClass(className) { //
            return this.class().isSet(className);
        };

        /**
         *
         * @param parent
         * @returns {El}
         */
        insert(parent) { //вставить объект в документ
            if (El.#isEmpty(parent)) {
                //вообще странная хрень, пару раз нещадно  глючило.
                if (document.body) {
                    document.body.appendChild(this.element);
                } else {
                    document.getElementsByTagName('body')[0].appendChild(this.element);
                }
                return this;
            } else if (parent instanceof El) {
                parent = parent.element;
            } else if (typeof parent === 'string') {
                parent = document.getElementById(parent);
            }
            parent.appendChild(this.element);
            return this;
        };

        /**
         * Вставить перед элементом
         * @param element {El|object|string|null}
         * @returns {El}
         */
        insertBefore(element) {
            if (El.#isEmpty(element)) {
                return this.insert();
            }
            if (element instanceof El) {
                element = element.element;
            } else if (typeof element === 'string') {
                element = document.getElementById(element);
            }

            if (typeof element === 'object') {
                element['parentNode'].insertBefore(this.element, element);
            }

            return this;
        };

        /**
         * вставить после элемента
         * @param element {El|object|string|null}
         * @returns {El}
         */
        insertAfter(element) { //вставить после элемента
            if (El.#isEmpty(element)) {
                return this.insert();
            }
            if (element instanceof El) {
                element = element.element;
            } else if (typeof element === 'string') {
                element = document.getElementById(element);
            }
            if (typeof element === 'object') {
                element['parentNode'].insertBefore(this.element, element['nextSibling']);
            }
            return this;
        };

        /**
         * вставить самым первым
         * @param element
         * @returns {El}
         */
        insertFirst(element) {
            if (El.#isEmpty(element)) {
                element = document.body;
            }
            if (element instanceof El) {
                element = element.el;
            } else if (typeof element === 'string') {
                element = document.getElementById(element);
            }

            if (typeof element === 'object') {
                let firstChild = element.firstChild;
                element.insertBefore(this.element, firstChild);
            }
            return this;
        };

        /**
         * вставить самым последним
         * @param element
         * @returns {El}
         */
        insertLast(element) {
            return this.insert(element); //аналогично
        };

        /**
         * поменять местами элементы
         * @param element
         * @returns {El}
         */
        swap(element) {
            if (El.#isEmpty(element)) {
                return this;
            }
            if (element instanceof El) {
                element.#stopAnimation(true);
                element = element.element;
            } else if (typeof element === 'string') {
                element = document.getElementById(element);
            }
            let
                f = this.element,
                t = element,
                tmpA = document.createElement('span'),
                tmpB = document.createElement('span');
            f.parentNode.insertBefore(tmpA, f);
            t.parentNode.insertBefore(tmpB, t);
            tmpA.parentNode.insertBefore(t, tmpA);
            tmpB.parentNode.insertBefore(f, tmpB);
            tmpA.parentNode.removeChild(tmpA);
            tmpB.parentNode.removeChild(tmpB);
            return this;
        };

        /**
         * заменить элемент El на наш
         * @param element
         * @returns {El}
         */
        replace(element) { //
            if (El.#isEmpty(element)) {
                return this.insert();
            }
            if (element instanceof El) {
                element.#stopAnimation(true);
                element = element.element;
            } else if (typeof parent === 'string') {
                element = document.getElementById(element);
            }
            this.insertBefore(element);
            element.parentNode.removeChild(element);
        };

        /**
         * удалить элемент из DOM
         * @returns {El}
         */
        remove() {
            this.#stopAnimation(true);
            let parent = this.element.parentNode || this.element.parentElement;
            if (parent) {
                parent.removeChild(this.element);
            }
            return this;
        };

        /**
         *  Переместить текущий элемент к указанному.
         * @param target
         */
        moveTo(target) {
            let parent = this.element.parentNode || this.element.parentElement;
            if (parent) {
                parent.removeChild(this.element);
                if (!(target instanceof El)) {
                    target = El.New(target);
                }
                let parentTarget = target.element.parentNode || target.element.parentElement;
                this.insertLast(parentTarget);
            }
        };

        /**
         * Элемент является DOM потомком цели
         * @param target {HTMLElement|string|null|El}
         * @returns {boolean}
         */
        isChild(target) {
            return El.#isChild(this.element, El.#getTarget(target));
        }

        /**
         * Элемент является DOM родителем цели
         * @param target {string|null|El}
         * @returns {boolean}
         */
        isParent(target) {
            return isChild(El.#getTarget(target), this.element);
        }

        /**
         *
         * @param asDOMElements {boolean}
         * @returns {[]|*}
         */
        childs(asDOMElements = false) {
            if (!asDOMElements) {
                return this.element.children;
            }
            return this.#convertToArrayOfEl(this.childs(false));

        }

        parent(asDOMElements = false) {
            return asDOMElements ? El.New(this.element.parentNode) : this.element.parentNode;
        };

        /**
         * найти потомка
         * @param search
         * @param asDOMElement
         * @returns {HTMLCollectionOf<SVGElementTagNameMap[string]>|ActiveX.IXMLDOMNodeList|HTMLCollectionOf<HTMLElementTagNameMap[string]>|HTMLCollectionOf<Element>|*[]|HTMLCollectionOf<Element>|Element|HTMLElement|El}
         */
        find(search, asDOMElement = false) { //
            if (typeof search != 'string') return [];
            let
                r = /^(?:[#|\.]([\w-]*))$/, //смотрим знак идентификатора # (#main) или знак класса
                m = r.exec(search),
                f = null,
                p = null;
            if (m) { //есть совпадения
                p = m[0][0]; //вытаскиваем первый символ
                f = m[1];
                if (p === '.') { //класс
                    return this.findByClass(f, asDOMElement);
                } else if (p === '#') {//id
                    return this.findById(f, asDOMElement);
                } else
                    return [];
            } else {
                return this.el.getElementsByTagName(search);
            }
        };

        /**
         * Найти первое совпадение
         * @param search
         * @returns {SVGElementTagNameMap|*|HTMLElementTagNameMap|Element|HTMLElement|null}
         */
        findFirst(search) {
            return this.find(search)[0];
        };

        /**
         * Найти потомка по ID
         * @param id {string}
         * @param asDOMElement {boolean}
         * @returns {Element | HTMLElement| El}
         */
        findById(id, asDOMElement = false) {
            if (this.isNull()) {
                return null;
            }
            let find = this.element.getElementById(id);
            return asDOMElement ? find : El.New(find);
        };

        /**
         * Найти потомков по классу
         * @param searchClass
         * @param asDOMElement {boolean}
         * @returns {HTMLCollectionOf<Element>}
         */
        findByClass(searchClass, asDOMElement = false) {
            if (this.isNull()) {
                return null;
            }
            let find = this.element.getElementsByClassName(searchClass);
            return asDOMElement ? find : this.#convertToArrayOfEl(find);
        };

        /**
         * Найти потомков по тегу
         * @param tag
         * @param asDOMElement
         * @returns {null|HTMLCollectionOf<*>|ActiveX.IXMLDOMNodeList|HTMLCollectionOf<Element>|[]}
         */
        findByTag(tag, asDOMElement = false) {
            if (this.isNull()) {
                return null;
            }
            let find = this.element.getElementsByTagName(tag);
            return asDOMElement ? find : this.#convertToArrayOfEl(find);
        };

        /**
         *
         * @param name
         * @param asDOMElement
         * @returns {NodeListOf<HTMLElement>|[]|null}
         */
        findByName(name, asDOMElement = false) {
            if (this.isNull()) {
                return null;
            }
            let find = this.element.getElementsByName(name);
            return asDOMElement ? find : this.#convertToArrayOfEl(find);
        };

        /**
         * Поиск потомка с тегом TAG и атррибутом
         * @param tag
         * @param attrName
         * @param attrValue
         * @param asDOMElement
         * @returns {null|[]}
         */
        findByTagAttr(tag, attrName, attrValue = null, asDOMElement = false) {
            if (this.isNull()) {
                return null;
            }
            let
                result = [];
            if (typeof attrName !== 'string') {
                return null;
            }
            let els = this.element.getElementsByTagName(tag);
            Array.from(els).forEach(detourEl => {
                let attr = El.New(detourEl).attr(attrName);
                if (!El.#isEmpty(attrValue)) {
                    if (attr === attrValue) {
                        result.push(asDOMElement ? detourEl : El.New(detourEl));
                    }
                } else {
                    result.push(asDOMElement ? detourEl : El.New(detourEl));
                }
            });
            return result;
        }

        /**
         * Поиск потомка по аттрибуту
         * @param attrName {string}
         * @param attrValue {null|string}
         * @param asDOMElement {boolean}
         * @returns {null|[]}
         */
        findByAttr(attrName, attrValue = null, asDOMElement = false) {
            return this.findByTagAttr('*', attrName, attrValue, asDOMElement);
        };

        /**
         * Возвращает первого совпавшего родителя с указанным тегом
         * @param tag
         * @param asDOMElement
         * @returns {El|null}
         */
        findParentTag(tag, asDOMElement = false) {
            return this.#findParent({
                'tag': tag
            }, asDOMElement);
        }

        /**
         * Возвращает первого совпавшего родителя с указанным тегом и классом
         * @param tag
         * @param className
         * @param asDOMElement
         * @returns {El|null}
         */
        findParentTagClass(tag, className, asDOMElement = false) {
            return this.#findParent({
                'tag': tag,
                'class': className
            }, asDOMElement);
        }

        /**
         * Применить стили к элементы
         * @param style {object}
         * @returns {El}
         */
        style(style) {
            if (this.isNull()) {
                return this;
            }
            for (let k in style) {
                if (this.element.style.hasOwnProperty(k)) {
                    this.element.style[k] = style[k];
                }
            }
            return this;
        }

        getStyles() {
            return this.element['currentStyle'] || window.getComputedStyle(this.element, null);
        };

        getStyle(style) {
            return this.getStyles()[style];
        }

        /**
         * Получить информацию о псевдо стиле
         * TODO: привязать к текущему элементу
         * @param pseudoStyle
         * @returns {null}
         */
        getPseudo(pseudoStyle) {
            let styles = Array.from(document.styleSheets);
            styles.forEach(styleSheet => {
                Array.from(styleSheet.rules).forEach(rules => {
                    if (typeof rules.selectorText != null && rules.selectorText === pseudoStyle) {
                        return rules.style;
                    }
                });
            });
            return null;
        }

        /**
         * Очистить элемент
         * @returns {El}
         */
        clear() {
            this.element.innerHTML = '';
            return this;
        }

        /**
         * Клонировать элемент
         * @param extend
         * @returns {El}
         */
        clone(extend) {
            return El.New(this.element.cloneNode(extend));
        }

        /**
         * Глубокое копирование данных объекта
         * @param obj
         * @returns {El|*}
         */
        deepCopy(obj) {
            deepCopy(obj, this);
        };

        /**
         * Прлучить координаты елемента
         * @returns {DOMRect}
         */
        getRect() {
            return this.element.getBoundingClientRect();
        }

        /**
         * Получить высоту элемента
         * @returns {number}
         */
        getHeight() {
            return Number(/\d+/.test(this.element.style.height) ? /\d+/.exec(this.element.style.height)[0] : this.element.offsetHeight);
        }

        /**
         * получить ширину элемента
         * @returns {number}
         */
        getWidth() {
            return Number(/\d+/.test(this.element.style.width) ? /\d+/.exec(this.element.style.width)[0] : this.element.offsetWidth);
        }

        /**
         * Прлучить ширину и высоту текста в элементе
         * @returns {{width: number, height: *}}
         */
        getTextPixels() {
            let
                clone = El.New('div').style({
                    left: '-10000px',
                    top: '-10000px',
                    height: 'auto',
                    width: 'auto',
                    position: 'absolute'
                });
            clone.html(this.html());
            clone.insert();
            let rect = {
                width: clone.element.clientWidth,
                height: clone.element.clientHeight
            };
            clone.remove();
            return rect;
        };

        /**
         * Работа с событиями
         * @param event {string}
         * @param fn {function}
         * @param add {boolean}
         * @returns {El}
         */
        event(event, fn, add = true) {
            if (add) {
                this.eventAdd(event, fn);
            } else {
                this.eventDel(event, fn);
            }
            return this;
        }

        /**
         * Алиас: Добавить событие
         * @param event
         * @param fn
         * @returns {El}
         */
        eventAdd(event, fn) {
            return this.#_event().add(event, fn);
        }

        /**
         * Алиас: Удалить событие
         * @param event
         * @param fn
         * @returns {El}
         */
        eventDel(event, fn) {
            return this.#_event().remove(event, fn);
        }

        /**
         * Связать изменение элемента с событиями элемента
         * @param caller {object}
         * @param field {null|string}
         * @param event {string|function}
         * @param fn {function|null}
         * @returns {El}
         */
        bind(caller, field, event, fn = null) {
            if (this.isNull()) {
                console.warn('element is null');
                return this;
            }

            if (typeof event === 'function') {
                fn = event;
                event = null;
            }

            if (typeof fn !== 'function') {
                fn = (() => {
                });
            }

            switch (this.el.type || null) {
                case 'text':
                case 'password':
                    this.event(event || 'keyup', (ev) => {
                        if (field != null) {
                            caller[field] = ev.target.value;
                        }
                        fn.call(caller, ev.target.value);
                    })
                    break;

                case 'select-one':
                    this.event('change', (ev) => {
                        if (field != null) {
                            caller[field] = ev.target.value;
                        }
                        fn.call(caller, ev.target.value);
                    })
                    break;

                case 'radio':
                case 'checkbox':
                    this.event('change', (ev) => {
                        if (field != null) {
                            caller[field] = ev.target.checked();
                        }
                        fn.call(caller, ev.target.checked);
                    })
                    break;

                default:
                    this.event('click', (ev) => {
                        if (field != null) {
                            caller[field] = ev.target.innerHTML;
                        }
                        fn.call(caller, ev.target.innerHTML);
                    })
            }

            return this;
        };

        //#######################
        //####### PRIVATE #######
        //#######################
        /**
         *  остановить анимацию
         * @param force
         */
        #stopAnimation(force) {
            this.q = [];
            if (this.animate) {
                this.animate.Stop(force);
            }
        }

        /**
         *
         * @param element
         * @param parent
         * @returns {boolean}
         */
        static #isChild(element, parent) {
            let res = false;
            while (element) {
                if (element.parentNode === parent) {
                    res = true;
                    break;
                }
                element = element.parentNode;
            }
            return res;
        }

        static #isEmpty(param) {
            return (param == null || param === '');
        }

        static #getTarget(target) {
            if (El.#isEmpty(target)) {
                target = document.body;
            }
            if (target instanceof El) {
                target = target.element;
            } else if (typeof target === 'string') {
                target = document.getElementById(target);
            }
            return target;
        }

        /**
         *
         * @param searchOptions
         * @param asDOMElement
         * @returns {null|El|ActiveX.IXMLDOMNode|Node|ParentNode}
         */
        #findParent(searchOptions, asDOMElement = false) {
            let element = this.element;
            while (element) {
                element = element.parentNode;
                let result = true;
                if (element) {
                    if (El.#isset(searchOptions, 'tag')) {
                        result = result && searchOptions.tag.toLowerCase() === element.tagName.toLowerCase();
                    }
                    if (El.#isset(searchOptions, 'class')) {
                        result = result && El.New(element).isClass(searchOptions.class);
                    }
                    if (El.#isset(searchOptions, 'name')) {
                        result = result && searchOptions.name === El.New(element).attr('name');
                    }
                    if (El.#isset(searchOptions, 'attr')) {
                        result = result && (El.New(element).attr(searchOptions.attr) != null);
                    }
                    if (result) return asDOMElement ? element : El.New(element);
                }
            }
            return null;
        }

        static #isset(object, field) {
            return object.hasOwnProperty(field);
        }

        /**
         *
         * @param elements
         * @returns {[]}
         */
        #convertToArrayOfEl(elements) {
            let result = [];
            Array.from(elements).forEach(detourElement => {
                result.push(El.New(detourElement));
            });
            return result;
        }

        /**
         *
         * @returns {{add: (function(*=, *=): (undefined)), remove: (function(*=, *): (undefined))}}
         * @private
         */
        #_event() {
            let _this = this;

            function commonHandle(event) {
                //this.events = [];
                let handlers = this.events[event.type];
                for (let g in handlers) {
                    if (!handlers.hasOwnProperty(g)) {
                        continue;
                    }
                    let
                        handler = handlers[g],
                        ret = handler.call(_this, event);
                    if (ret === false) {
                        event.preventDefault();
                        event.stopPropagation()
                    }
                }
            }

            return {
                add: function (type, handler) {
                    if (typeof handler !== 'function') {
                        return;
                    }
                    if (!_this.element.events) {
                        _this.element.events = {};
                        _this.element.handle = function (event) {
                            if (typeof Event !== "undefined") {
                                return commonHandle.call(_this.element, event)
                            }
                        }
                    }

                    if (!_this.element.events[type]) {
                        _this.element.events[type] = {};
                        if (_this.element.addEventListener) {
                            _this.element.addEventListener(type, _this.element.handle, false);
                        } else if (_this.element['attachEvent']) {
                            _this.element['attachEvent']("on" + type, _this.element.handle)
                        }
                    }

                    _this.element.events[type][uid('event')] = handler
                },
                remove: function (type, handler) {
                    let handlers = _this.element.events && _this.element.events[type];

                    if (!handlers) {
                        return;
                    }
                    let guid = -1;
                    for (let id in handlers) {
                        if (!handlers.hasOwnProperty(id)) {
                            continue;
                        }
                        if (handler.toString() === handlers[id].toString()) {
                            guid = id;
                            break;
                        }
                    }

                    delete handlers[guid];

                    if (Object.size(handlers) === 0) {

                        delete _this.element.events[type];

                        if (_this.element.removeEventListener) {
                            _this.element.removeEventListener(type, _this.element.handle, false);
                        } else if (_this.element['detachEvent']) {
                            _this.element['detachEvent']("on" + type, _this.element.handle);
                        }
                    }
                }
            }
        }
    }

    El.New = function (element) {
        return new El(element);
    }

    El.New.prototype = El.prototype;

    /**
     * Класс, который реагирует на изменения своих параметров при биндах
     */
    class Bind {
        #updTimer;
        #riseEvents = {};
        #snapshot = {};

        /**
         *
         * @param observer {boolean} Авто наблюдение за изменениями полей. Для того, чтобы не вызывать Class::propertyInvoke(...), Жрёт ресурсы, так как создаёю таймер отслеживания.
         */
        constructor(observer = false) {
            if (observer) {
                let _this = this;
                this.#updTimer = setInterval(() => {
                    _this.#getSnapshot.call(_this);
                }, 100);
            }
        }

        #getSnapshot() {
            for (let property in this) {
                if (!this.hasOwnProperty(property)) {
                    continue;
                }

                if (!this.#equals(property)) {
                    this.#snapshot[property] = Object.clone(this[property]);
                    this.propertyInvoke(property);
                }

                if (this.#snapshot[property] == null && this[property]) {
                    this.#snapshot[property] = Object.clone(this[property]);
                }
            }
        }

        /**
         * Вызвать событие
         * @param property {string}
         * @param value {null|string|function}
         */
        propertyInvoke(property, value = null) {
            if (this.hasOwnProperty(property)) {
                if (typeof value === 'string') {
                    this[property] = value
                } else if (typeof value === 'function') {
                    value.call(this);
                }
                this.#rise(property);
            }
        }

        #equals(property) {
            if (this.#snapshot[property] == null && this[property] != null) {
                return false;
            } else if (typeof this[property] === 'object') {
                let  //для отладки
                    a = JSON.stringify(this[property]),
                    b = JSON.stringify(this.#snapshot[property]);
                return a === b;
            } else {
                return this.#snapshot[property] === this.#snapshot[property]
            }
        }

        #rise(property) {
            if (this.#riseEvents.hasOwnProperty(property)) {
                this.#riseEvents[property].forEach(rise => {
                    rise.fn.call(rise.caller, this[property]);
                });
            }
        }

        bind(property, caller, fn) {
            if (!this.#riseEvents.hasOwnProperty(property)) {
                this.#riseEvents[property] = [];
            }
            this.#riseEvents[property].push({
                caller: caller,
                fn: fn
            })
        }

        unbind(property, caller, fn) {
            if (this.#riseEvents[property] instanceof Array) {
                let find;
                this.#riseEvents[property].forEach(bind => {
                    let  //для отладки
                        a = JSON.stringify(fn),
                        b = JSON.stringify(bind.fn);
                    if (caller === bind.caller && a === b) {
                        find = bind;
                    }
                });
                if (find) {
                    this.#riseEvents[property].remove(find);
                }
            }
        }

    }

    window.El = El.New;
    window.Bind = Bind;
})();
