export default {
    created: function(){
        $(function(){
            $("body").on('click', 'li.treeview > a', function(e){
                e.preventDefault();
                e.stopPropagation();
                let btn = $(this);
                let menu = $(this).parent().children(".treeview-menu").first();
                let isActive = $(this).parent().hasClass('active');

                /*if (isActive) {
                    menu.show();
                    btn.children(".fa-angle-left").first().removeClass("fa-angle-left").addClass("fa-angle-down");
                }*/

                if (isActive) {
                    //Slide up to close menu
                    menu.slideUp();
                    isActive = false;
                    btn.children(".fa-angle-down").first().removeClass("fa-angle-down").addClass("fa-angle-left");
                    btn.parent("li").removeClass("active");
                } else {
                    //Slide down to open menu
                    menu.slideDown();
                    isActive = true;
                    btn.children(".fa-angle-left").first().removeClass("fa-angle-left").addClass("fa-angle-down");
                    btn.parent("li").addClass("active");
                }
            });
            setTimeout(function () {
                $('.sidebar .treeview').each(function(){
                    let menu = $(this).children(".treeview-menu").first();
                    menu.find("li > a").each(function() {
                        let pad = parseInt($(this).css("margin-left")) + 10;
                        $(this).css({"margin-left": pad + "px"});
                    });
                });

            }, 200);

        });
    },
    data: function(){
        return {

        }
    },
    methods: {

    }
}