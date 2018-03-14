$(function () {
    $(".table-click tbody tr").on("click", function () {
        window.location = $(this).attr("data-url");
    });
    $("#example2").dataTable();
    $("#example3").dataTable();
    $("#example4").dataTable();
    $("#example5").dataTable();
    $("#example6").dataTable();
    $("#example7").dataTable();
});