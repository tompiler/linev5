var data = d3.csvParse("Year,Make,Model,Length\n1997,Ford,E350,2.34\n2000,Mercury,Cougar,2.38\n", function(d) {
    return {
      year: new Date(+d.Year, 0, 1), // lowercase and convert "Year" to Date
      make: d.Make, // lowercase
      model: d.Model, // lowercase
      length: +d.Length // lowercase and convert "Length" to number
    };
  });

//console.log(data);

d3.csv("data/data.csv").then(function(rows) {
    console.log(rows)
})




