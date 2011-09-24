var Utilities = {

    /**
     * Returns window height
     */
    getWindowHeight : function() {
        return([
            window.innerHeight ? window.innerHeight : null,
            document.documentElement ? document.documentElement.clientHeight : null,
            document.body ? document.body.clientHeight : null
        ].select(function(height) {
            return height > 0
        }).first() || 0);
    },

    /**
     * Returns window scroll top
     */
    getWindowScrollTop : function() {
        return ([
            window.pageYOffset ? window.pageYOffset : null,
            document.documentElement ? document.documentElement.scrollTop : null,
            document.body ? document.body.scrollTop : null
        ].select(function(scrollTop) {
            return scrollTop > 0
        }).first() || 0);
    },

    /**
     * Returns the closest number as the result of using i as a multiplication factor
     *
     * @param n limit number
     * @param i factor number
     */
    floorToInterval : function(n, i) {
        return Math.floor(n / i) * i;
    }
};