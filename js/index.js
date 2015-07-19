// TODO
// 1. 浏览大图时左右箭头位置应当固定
// 2. 消除浏览大图时的闪烁
// 3. 目前代码耦合太紧密，不利于单元测试，须想办法解耦

var waterfall = {
    totalColumns: 0,
    columnOffsets: [],

    itemSelector: '.pic-item',
    listSelector: '.pic-list',
    containerSelector: '.main',

    init: function() {
        this.bindEvents();
    },

    bindEvents: function() {
        // 设置 content 区域宽度要在 DOMReady 时做，避免闪烁
        // 事实上还是会有轻微闪烁，因为当第二次刷新页面时，图片已有缓存，在宽度设置好之前就已经显示出来了
        $(this.setContentWidth.bind(this));

        // 图片全部载入完成后进行重排
        $(window).on('load', this.reflow.bind(this));

        // 滚动到页面底部后触发「加载更多」事件
        $(window).on('scroll', this.onScrollHandler.bind(this));

        var self = this;
        $(window).on('resize', function() {
            self.setContentWidth();
            self.reflow();
        });
    },

    setContentWidth: function() {
        var itemWidth = $(this.itemSelector).eq(0).outerWidth();  // 每张图片所在区域的宽度
        this.totalColumns = Math.floor($(window).width() / itemWidth);  // 列数

        // container 水平居中
        var $container = $(this.containerSelector);
        $container.css({
            width: itemWidth * this.totalColumns
        });
    },

    // 将页面上的图片按瀑布流的方式重排
    reflow: function() {
        var $items = $(this.itemSelector);

        this.columnOffsets = []; // 需要重新初始化为空数组，因为如果页面 resize 了列数可能变化

        // 初始化各列的偏移量
        for (var i = 0; i !== this.totalColumns; ++i) {
            var $item = $items.eq(i);

            $item.css('position', 'static');    // 考虑到页面 resize 的情况，须重置样式

            this.columnOffsets[i] = {
                top: 0,
                left: $items.eq(i).position().left
            };
        }

        var setItemPosition = this.setItemPosition.bind(this);
        $items.each(function(index, item) {
            setItemPosition($(item));
        });
    },

    // 将图片放置到高度最低的一列下方
    setItemPosition: function($item) {
        // 找出高度最低的列数（高度一样的话以第一个出现的为准）
        var shortestColumn = this.findMinIndex(this.columnOffsets, function(a, b) {
            return a.top - b.top;
        });

        // 放置元素
        $item.css({
            position: 'absolute',
            top: this.columnOffsets[shortestColumn].top,
            left: this.columnOffsets[shortestColumn].left
        });

        // 该列的高度增加
        this.columnOffsets[shortestColumn].top += $item.outerHeight();
    },

    findMinIndex: function(arr, compare) {
        // 不是数组/空数组 就直接返回 undefined
        if (!arr.length) {
            return undefined;
        }

        // 默认的比较方式是判断 a - b 的值
        if (!compare) {
            compare = function(a, b) { return a - b; };
        }

        var minIndex = 0;
        for (var i = 1; i !== arr.length; ++i) {
            minIndex = (compare(arr[i], arr[minIndex]) < 0 ? i : minIndex);
        }

        return minIndex;
    },

    // 加载更多
    loadMore: function() {
        var $list = $(this.listSelector);
        var setItemPosition = this.setItemPosition.bind(this);

        $.getJSON('mock/pictures.json', function(pics) {
            pics.forEach(function(pic) {
                var $item = $(
                    '<li class="pic-item">' +
                        '<div class="pic">' +
                            '<img src="' + pic.thumbnail + '" data-large-src="' + pic.large + '">' +
                        '</div>' +
                    '</li>'
                );
                $list.append($item);

                setItemPosition($item);
            });
        });
    },

    hasReachedBottom: function() {
        var $last = $(this.itemSelector).last();

        var scrollTop = $(window).scrollTop();
        var winHeight = $(window).height();

        return $last.offset().top < scrollTop + winHeight;
    },

    onScrollHandler: function() {
        this.hasReachedBottom() && this.loadMore(); // eslint-disable-line
    }
};

var gallery = {
    $item: null,

    init: function() {
        this.bindEvents();
    },

    bindEvents: function() {
        $('body').on('click', '.pic-item img', this.showGallery.bind(this));
        $('body').on('click', '.gallery-next', this.nextPicture.bind(this));
        $('body').on('click', '.gallery-prev', this.prevPicture.bind(this));
        $('body').on('click', '.gallery-close', this.closeGallery.bind(this));
        $('body').on('click', '.overlay', this.closeGallery.bind(this));
    },

    // 显示图片浏览器
    showGallery: function(evt) {
        this.$item = $(evt.target).parent();
        this.showPicture($(evt.target).data('large-src'));

        $('.overlay, .gallery').removeClass('hidden');
    },

    // 关闭图片浏览
    closeGallery: function() {
        $('.gallery, .overlay').addClass('hidden');
    },

    // 下一张
    nextPicture: function() {
        this.$item = this.$item.next();
        this.showPicture(this.$item.find('img').data('large-src'));
    },

    // 上一张
    prevPicture: function() {
        this.$item = this.$item.prev();
        this.showPicture(this.$item.find('img').data('large-src'));
    },

    showPicture: function(src) {
        if (!src) {
            return;
        }

        var img = new Image();
        img.src = src;
        img.onload = function() {
            var w = this.width;
            var h = this.height;
            var winHeight = $(window).height();
            var winWidth = $(window).width();

            this.style.width = 'auto';
            this.style.height = 'auto';

            if (w / h > 1) {
                // 如果是横向的图，最大宽度为 窗口宽度 - 120
                // 左右两侧留 50px 用于导航，此外上下需要稍微有点空隙不能顶着边缘，所以 +20px
                // 这里假设窗口一定宽于 100px（窄于 100px 的根本没有任何兼容必要嘛……）
                this.style.maxWidth = (winWidth - 150) + 'px';
            } else {
                // 纵向图的高度等于窗口高度
                this.style.maxHeight = winHeight + 'px';
            }
        };

        $('.gallery-picture').empty().append(img);
        this.showArrows();
    },

    showArrows: function() {
        // 显示所有箭头
        $('.gallery-nav').removeClass('hidden');

        // 如果是最后一张图，隐藏「下一张」；如果是第一张图，隐藏「上一张」
        if (this.$item.is(':last-child')) {
            $('.gallery-next').addClass('hidden');
        } else if (this.$item.is(':first-child')) {
            $('.gallery-prev').addClass('hidden');
        }
    }
};

waterfall.init();
gallery.init();
