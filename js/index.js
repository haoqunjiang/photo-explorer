// TODO
// 目前代码耦合太紧密，不利于单元测试，须想办法解耦

var app = {
    columnOffsets: [],

    itemSelector: '.pic-item',
    listSelector: '.pic-list',
    containerSelector: '.main',

    init: function() {
        $(window).on('load', this.waterfall.bind(this));
        $(window).on('scroll', this.onScrollHandler.bind(this));
    },

    // 页面初始化后进行重排
    waterfall: function() {
        var $items = $(this.itemSelector);

        var itemWidth = $items.eq(0).outerWidth();  // 每张图片所在区域的宽度
        var totalColumns = Math.floor($(window).width() / itemWidth);   // 列数

        // container 水平居中
        var $container = $(this.containerSelector);
        $container.css({
            // 计算 outerWidth 的时候会有稍许误差（结果是 349 但是渲染出来是 349.01，所以 +3 补偿一下）
            width: itemWidth * totalColumns + 3
        });

        // 初始化各列的偏移量
        for (var i = 0; i !== totalColumns; ++i) {
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
        var appendImage = this.appendImage.bind(this);

        $.getJSON('mock/pictures.json', function(pics) {
            pics.forEach(appendImage);
        });
    },

    appendImage: function(pic) {
        var $item = $(
            '<li class="pic-item">' +
                '<div class="pic">' +
                    '<img src="' + pic.thumbnail + '" data-large-src="' + pic.large + '">' +
                '</div>' +
            '</li>'
        );
        $(this.listSelector).append($item);

        this.setItemPosition($item);
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
