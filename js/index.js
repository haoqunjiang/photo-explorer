var app = {
    arrayOfHeights: [],
    arrayOfPositionLeft: [],

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
        var itemWidth = $items.eq(0).outerWidth();
        var columns = Math.floor($(window).width() / itemWidth);

        var $container = $(this.containerSelector);
        $container.css({
            // 计算 outerWidth 的时候会有稍许误差（结果是 349 但是渲染出来是 349.01，所以 +3 补偿一下）
            width: itemWidth * columns + 3
        });

        var self = this;
        $items.each(function(index, item) {
            var $item = $(item);

            // 第一行，只记录高度，不作处理
            if (index < columns) {
                self.arrayOfHeights[index] = $item.outerHeight();
                self.arrayOfPositionLeft[index] = $item.position().left;
                return;
            }

            // 第二行以下，瀑布流布局，将图片加到高度最低的一列下方
            self.setItemPosition($item);
        });
    },

    // 对于第二排以下的图片，设置合适的位置
    setItemPosition: function($item) {
        var minHeight = Math.min.apply(undefined, this.arrayOfHeights);
        var minHeightColumn = this.arrayOfHeights.indexOf(minHeight);

        $item.css({
            position: 'absolute',
            top: minHeight,
            left: this.arrayOfPositionLeft[minHeightColumn]
        });

        this.arrayOfHeights[minHeightColumn] += $item.outerHeight();
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
