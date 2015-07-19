// TODO
// 目前代码耦合太紧密，不利于单元测试，须想办法解耦

var app = {
    totalColumns: 0,
    columnOffsets: [],

    itemSelector: '.pic-item',
    listSelector: '.pic-list',
    containerSelector: '.main',

    init: function() {
        // 设置 content 区域宽度要在 DOMReady 时做，避免闪烁
        // 事实上还是会有轻微闪烁，因为当第二次刷新页面时，图片已有缓存，在宽度设置好之前就已经显示出来了
        $(this.setContentWidth.bind(this));

        // 图片全部载入完成后进行重排
        $(window).on('load', this.waterfall.bind(this));

        // 滚动到页面底部后触发「加载更多」事件
        $(window).on('scroll', this.onScrollHandler.bind(this));

        var self = this;
        $(window).on('resize', function() {
            self.setContentWidth();
            self.waterfall();
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
    waterfall: function() {
        var $items = $(this.itemSelector);

        this.columnOffsets = []; // 需要重新初始化为空数组，因为如果页面 resize 了列数可能变化

        // 初始化各列的偏移量
        for (var i = 0; i !== this.totalColumns; ++i) {
            var $item = $items.eq(i);

            $item.css('position', 'static');    // 考虑到页面 resize 的情况，需重置 CSS

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

app.init();
