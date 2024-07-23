$(document).ready(function() {
    $('.ui.dropdown').dropdown();

    d3.csv("https://media.nbcnewyork.com/assets/editorial/national/2024/olympics/athlete-cards/data/athlete-complete-data.csv?" + Math.floor(Math.random() * 1000)).then(function(data) {

    var data = data.sort(function(x, y){
        return d3.ascending(x.last_name, y.last_name);
     })

    d3.select(".menu")
        .selectAll(".item")
        .data(data)
        .enter()
        .append("div")
        .attr("class","item")
        .attr("data-value", function(d){
            return d.athlete_id
        })
        .html(function(d){
            return d.first_name + " " + d.last_name
        })
    })

    $('.ui.dropdown')
      .dropdown('setting', 'onChange', function(d){
        d3.select("#pcode").text(

            '<p><iframe src="https://media.nbcnewyork.com/assets/editorial/national/2024/olympics/athlete-cards/athlete-cards/?athlete=' + d + '" id="athlete-card-' + d + '" width="100%" height="350" frameborder="0" scrolling="no"></iframe></p>'

        )
        setTimeout(function() {
            d3.select(".example").html(
                '<p><iframe src="https://media.nbcnewyork.com/assets/editorial/national/2024/olympics/athlete-cards/athlete-cards/?athlete=' + d + '" id="athlete-card-' + d + '" width="100%" height="350" frameborder="0" scrolling="yes"></iframe></p>'
            )

            xtalk.signalIframe()
        }, 1000);


    });

    d3.select("#copier").on("click", function(event){

        event.preventDefault();

        var copyText = d3.select("#pcode");
        navigator.clipboard.writeText(copyText.text());

    })

});
