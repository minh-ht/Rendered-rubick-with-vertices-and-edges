"use strict";

var canvas;
var gl;

var positions = [];
var colors = [];

var modelViewMatrixLoc, projectionMatrixLoc;
var modelViewMatrix, projectionMatrix;
var uDrawStatus;

var theta = [0, 0, 0];
var uTheta;

var x_rotateSpeed = 0;
var y_rotateSpeed = 0;
var z_rotateSpeed = 0;

var phi = 0;
var thetaO = 0;
var radius = 1;

var eye = vec3(radius*Math.sin(thetaO)*Math.cos(phi), radius*Math.sin(phi), radius*Math.cos(thetaO)*Math.cos(phi));
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var near = 0.3;
var far = 3.0;
var fovy = 90.0;
var aspect;

var program;

var rubicSize = 400;

var rubic_vertices = [
    vec3(-rubicSize/2, rubicSize/2, rubicSize/2),   // 0
    vec3(rubicSize/2, rubicSize/2, rubicSize/2),    // 1
    vec3(rubicSize/2, -rubicSize/2, rubicSize/2),   // 2
    vec3(-rubicSize/2, -rubicSize/2, rubicSize/2),  // 3
    vec3(-rubicSize/2, rubicSize/2, -rubicSize/2),  // 4
    vec3(rubicSize/2, rubicSize/2, -rubicSize/2),   // 5
    vec3(rubicSize/2, -rubicSize/2, -rubicSize/2),  // 6
    vec3(-rubicSize/2, -rubicSize/2, -rubicSize/2)  // 7
];

var grid_vertices = [
    vec3(-rubicSize/6, rubicSize/2, rubicSize/2),   // 0
    vec3(rubicSize/6, rubicSize/2, rubicSize/2),    // 1
    vec3(rubicSize/2, rubicSize/6, rubicSize/2),    // 2
    vec3(rubicSize/2, -rubicSize/6, rubicSize/2),   // 3
    vec3(rubicSize/6, -rubicSize/2, rubicSize/2),   // 4
    vec3(-rubicSize/6, -rubicSize/2, rubicSize/2),  // 5
    vec3(-rubicSize/2, -rubicSize/6, rubicSize/2),  // 6
    vec3(-rubicSize/2, rubicSize/6, rubicSize/2),   // 7
    vec3(rubicSize/2, rubicSize/2, rubicSize/6),    // 8
    vec3(rubicSize/2, rubicSize/2, -rubicSize/6),   // 9
    vec3(rubicSize/2, rubicSize/6, -rubicSize/2),   // 10
    vec3(rubicSize/2, -rubicSize/6, -rubicSize/2),  // 11
    vec3(rubicSize/2, -rubicSize/2, -rubicSize/6),  // 12
    vec3(rubicSize/2, -rubicSize/2, rubicSize/6),   // 13
    vec3(-rubicSize/2, rubicSize/2, rubicSize/6),   // 14
    vec3(-rubicSize/2, rubicSize/2, -rubicSize/6),  // 15
    vec3(-rubicSize/2, rubicSize/6, -rubicSize/2),  // 16
    vec3(-rubicSize/2, -rubicSize/6, -rubicSize/2), // 17
    vec3(-rubicSize/2, -rubicSize/2, -rubicSize/6), // 18
    vec3(-rubicSize/2, -rubicSize/2, rubicSize/6),  // 19
    vec3(-rubicSize/6, rubicSize/2, -rubicSize/2),  // 20
    vec3(rubicSize/6, rubicSize/2, -rubicSize/2),   // 21
    vec3(rubicSize/6, -rubicSize/2, -rubicSize/2),  // 22
    vec3(-rubicSize/6, -rubicSize/2, -rubicSize/2), // 23
    vec3(-rubicSize/2, rubicSize/2, rubicSize/2),   // 24   0
    vec3(rubicSize/2, rubicSize/2, rubicSize/2),    // 25   1
    vec3(rubicSize/2, -rubicSize/2, rubicSize/2),   // 26   2
    vec3(-rubicSize/2, -rubicSize/2, rubicSize/2),  // 27   3
    vec3(-rubicSize/2, rubicSize/2, -rubicSize/2),  // 28   4
    vec3(rubicSize/2, rubicSize/2, -rubicSize/2),   // 29   5
    vec3(rubicSize/2, -rubicSize/2, -rubicSize/2),  // 30   6
    vec3(-rubicSize/2, -rubicSize/2, -rubicSize/2)  // 31   7
];

// var allColors = [
//     vec3(0.0, 0.0, 0.0),  // black      0
//     vec3(1.0, 0.0, 0.0),  // red        1
//     vec3(1.0, 1.0, 0.0),  // yellow     2
//     vec3(0.0, 1.0, 0.0),  // green      3
//     vec3(0.0, 0.0, 1.0),  // blue       4
//     vec3(1.0, 0.65, 0.0), // orange     5
//     vec3(1.0, 0.0, 1.0),  // magenta    6
//     vec3(0.0, 1.0, 1.0),  // cyan       7
//     vec3(1.0, 1.0, 1.0)   // white      8
// ];

var colorsDict = {
    "black":    vec3(0.0, 0.0, 0.0),
    "red":      vec3(1.0, 0.0, 0.0),
    "yellow":   vec3(1.0, 1.0, 0.0),
    "green":    vec3(0.0, 1.0, 0.0),
    "blue":     vec3(0.0, 0.0, 1.0),
    "orange":   vec3(1.0, 0.65, 0.0),
    "magenta":  vec3(1.0, 0.0, 1.0),
    "cyan":     vec3(0.0, 1.0, 1.0),
    "white":    vec3(1.0, 1.0, 1.0),
    "pastel":   vec3(0.99, 0.737, 0.812)
};

window.onload = function init()
{
    canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext("webgl2");
    if (!gl)
        alert("WebGL 2.0 isn't available");
    
    aspect =  canvas.width/canvas.height;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.99, 0.737, 0.812, 1.0);
    gl.enable(gl.DEPTH_TEST);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var uUserCoordinates = gl.getUniformLocation(program, "uUserCoordinates");
    gl.uniform3f(uUserCoordinates, canvas.width, canvas.height, canvas.width);

    modelViewMatrixLoc = gl.getUniformLocation(program, "uModelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "uProjectionMatrix");

    uTheta = gl.getUniformLocation(program, "uTheta");
    uDrawStatus = gl.getUniformLocation(program, "uDrawStatus");

    var isDrag = false;
    var invertXaxis = 1;
    var invertYaxis = 1;
    var xRate = 0.005;
    var yRate = 0.005;
    var x = 0;
    var y = 0;
    var zRate = 0.05;
    
    var invXcheck = document.getElementById("invertXaxis");
    var invYcheck = document.getElementById("invertYaxis");
    var Xsenslider = document.getElementById("X-sensivity");
    var Ysenslider = document.getElementById("Y-sensivity");
    var zoomSlider = document.getElementById("zoom-slider");
    var eyeValue = document.getElementById("eyeValue");
    var radiusValue = document.getElementById("radiusValue");

    // checkbox invert axis
    invXcheck.addEventListener("click", () => {
        invertXaxis *= -1;
    });

    invYcheck.addEventListener("click", () => {
        invertYaxis *= -1;
    });
    //
    
    // sensivity sliders
    function sliderXhandler() {
        xRate = parseFloat(this.value);
    }
    Xsenslider.addEventListener("change", sliderXhandler);
    Xsenslider.addEventListener("mousemove", sliderXhandler);
    
    function sliderYhandler() {
        yRate = parseFloat(this.value);
    }
    Ysenslider.addEventListener("change", sliderYhandler);
    Ysenslider.addEventListener("mousemove", sliderYhandler);
    //

    // zoom slider
    function zsliderHandler() {
        zRate = parseFloat(this.value);
    }
    zoomSlider.addEventListener("change", zsliderHandler);
    zoomSlider.addEventListener("mousemove", zsliderHandler);
    //

    // Scroll to zoom
    canvas.addEventListener("wheel", (e) => {
        radius += (e.deltaY == 100 ? zRate : (radius >= zRate ? -zRate : 0));
        console.log(radius);
        eye = vec3(radius*Math.sin(thetaO)*Math.cos(phi), radius*Math.sin(phi), radius*Math.cos(thetaO)*Math.cos(phi));

        // change radiusValue
        radiusValue.textContent = `radius: ${radius.toFixed(3)}`;
        
        e.preventDefault();
    });
    //
    
    // Drag to change eye
    canvas.addEventListener("mousedown", (e) => {
        x = e.offsetX;
        y = e.offsetY;
        isDrag = true;
    });

    canvas.addEventListener("mousemove", (e) => {
        if (isDrag == true)
        {
            var changeX = e.offsetX - x;
            var changeY = e.offsetY - y;
            
            thetaO = (thetaO - invertXaxis*changeX*xRate)%(2*Math.PI);
            phi = (phi + invertYaxis*changeY*yRate)%(2*Math.PI);
            if (phi >= Math.PI/2 && phi <= Math.PI*3/2)
                up = vec3(0.0, -1.0, 0.0);
            else
                up = vec3(0.0, 1.0, 0.0);
            eye = vec3(radius*Math.sin(thetaO)*Math.cos(phi), radius*Math.sin(phi), radius*Math.cos(thetaO)*Math.cos(phi));
            
            // change eyeValue
            eyeValue.textContent = `eye(${eye[0].toFixed(3)}, ${eye[1].toFixed(3)}, ${eye[2].toFixed(3)})`;

            x = e.offsetX;
            y = e.offsetY;

            e.preventDefault();
        }
    });

    document.addEventListener("mouseup", (e) => {
        isDrag = false;
    });
    //

    // Keyboard to rotate
    document.addEventListener("keydown", (e) => {
        if (e.key == 'a')
            y_rotateSpeed -= 0.5;
        if (e.key == 'd')
            y_rotateSpeed += 0.5;
        if (e.key == 's')
            x_rotateSpeed += 0.5;
        if (e.key == 'w')
            x_rotateSpeed -= 0.5;
        if (e.key == 'q')
            z_rotateSpeed += 0.5;
        if (e.key == 'e')
            z_rotateSpeed -= 0.5;
    });

    render();
}

function quad(verticesArray, colorsArray, a, b, c, d, color)
{
    var indices = [a, b, c, a, c, d];

    for (let i = 0; i < indices.length; i++) {
        verticesArray.push(rubic_vertices[indices[i]]);
        colorsArray.push(colorsDict[color]);
    }
}

function line(verticesArray, colorsArray, a, b, color)
{
    verticesArray.push(grid_vertices[a]);
    colorsArray.push(colorsDict[color]);
    verticesArray.push(grid_vertices[b]);
    colorsArray.push(colorsDict[color]);
}

function renderCoordinate() {
    var verticesCoordinate = [
        vec3(0, -canvas.height, 0), vec3(0, canvas.height, 0), vec3(-canvas.width, 0, 0), vec3(canvas.width, 0, 0), vec3(0, 0, -canvas.width), vec3(0, 0, canvas.width)
    ];

    var colorsCoordinate = [
        vec3(0.0, 0.0, 1.0), vec3(0.0, 0.0, 1.0), vec3(0.0, 0.0, 1.0), vec3(0.0, 0.0, 1.0), vec3(0.0, 0.0, 1.0), vec3(0.0, 0.0, 1.0)
    ];
    
    var vBufferCoordinate = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBufferCoordinate);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(verticesCoordinate), gl.STATIC_DRAW);

    var positionLocCoordinate = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(positionLocCoordinate, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocCoordinate);

    var cBufferCoordinate = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBufferCoordinate);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsCoordinate), gl.STATIC_DRAW);

    var colorLocCoordinate = gl.getAttribLocation(program, "aColor");
    gl.vertexAttribPointer(colorLocCoordinate, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLocCoordinate);

    gl.uniform1i(uDrawStatus, 0);
    gl.drawArrays(gl.LINES, 0, verticesCoordinate.length);
}

function renderRubic() {
    var verticesRubic = [];
    var colorsRubic = [];
    
    quad(verticesRubic, colorsRubic, 0, 3, 2, 1, "blue");
    quad(verticesRubic, colorsRubic, 0, 1, 5, 4, "yellow");
    quad(verticesRubic, colorsRubic, 1, 2, 6, 5, "red");
    quad(verticesRubic, colorsRubic, 4, 5, 6, 7, "green");
    quad(verticesRubic, colorsRubic, 0, 4, 7, 3, "orange");
    quad(verticesRubic, colorsRubic, 2, 3, 7, 6, "white");

    var vBufferRubic = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBufferRubic);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(verticesRubic), gl.STATIC_DRAW);
    
    var positionLocRubic = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(positionLocRubic, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocRubic);
    
    var cBufferRubic = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBufferRubic);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsRubic), gl.STATIC_DRAW);
    
    var colorLocRubic = gl.getAttribLocation(program, "aColor");
    gl.vertexAttribPointer(colorLocRubic, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLocRubic);
    
    gl.uniform1i(uDrawStatus, 1);
    gl.drawArrays(gl.TRIANGLES, 0, verticesRubic.length);
}

function renderGrid() {
    var verticesGrid = [];
    var colorsGrid = [];

    line(verticesGrid, colorsGrid, 0, 5, "black");
    line(verticesGrid, colorsGrid, 1, 4, "black");
    line(verticesGrid, colorsGrid, 2, 7, "black");
    line(verticesGrid, colorsGrid, 3, 6, "black");
    line(verticesGrid, colorsGrid, 0, 20, "black");
    line(verticesGrid, colorsGrid, 1, 21, "black");
    line(verticesGrid, colorsGrid, 8, 14, "black");
    line(verticesGrid, colorsGrid, 9, 15, "black");
    line(verticesGrid, colorsGrid, 2, 10, "black");
    line(verticesGrid, colorsGrid, 3, 11, "black");
    line(verticesGrid, colorsGrid, 8, 13, "black");
    line(verticesGrid, colorsGrid, 9, 12, "black");
    line(verticesGrid, colorsGrid, 6, 17, "black");
    line(verticesGrid, colorsGrid, 7, 16, "black");
    line(verticesGrid, colorsGrid, 14, 19, "black");
    line(verticesGrid, colorsGrid, 15, 18, "black");
    line(verticesGrid, colorsGrid, 20, 23, "black");
    line(verticesGrid, colorsGrid, 21, 22, "black");
    line(verticesGrid, colorsGrid, 10, 16, "black");
    line(verticesGrid, colorsGrid, 11, 17, "black");
    line(verticesGrid, colorsGrid, 4, 22, "black");
    line(verticesGrid, colorsGrid, 5, 23, "black");
    line(verticesGrid, colorsGrid, 12, 18, "black");
    line(verticesGrid, colorsGrid, 13, 19, "black");
    line(verticesGrid, colorsGrid, 24, 25, "black");
    line(verticesGrid, colorsGrid, 25, 26, "black");
    line(verticesGrid, colorsGrid, 26, 27, "black");
    line(verticesGrid, colorsGrid, 27, 24, "black");
    line(verticesGrid, colorsGrid, 24, 28, "black");
    line(verticesGrid, colorsGrid, 25, 29, "black");
    line(verticesGrid, colorsGrid, 26, 30, "black");
    line(verticesGrid, colorsGrid, 27, 31, "black");
    line(verticesGrid, colorsGrid, 28, 29, "black");
    line(verticesGrid, colorsGrid, 29, 30, "black");
    line(verticesGrid, colorsGrid, 30, 31, "black");
    line(verticesGrid, colorsGrid, 31, 28, "black");
    
    var vBufferGrid = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBufferGrid);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(verticesGrid), gl.STATIC_DRAW);
    
    var positionLocGrid = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(positionLocGrid, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocGrid);
    
    var cBufferGrid = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBufferGrid);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsGrid), gl.STATIC_DRAW);
    
    var colorLocGrid = gl.getAttribLocation(program, "aColor");
    gl.vertexAttribPointer(colorLocGrid, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLocGrid);
    
    gl.uniform1i(uDrawStatus, 1);
    gl.drawArrays(gl.LINES, 0, verticesGrid.length);
}

function render()
{
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    modelViewMatrix = lookAt(eye, at , up);
    projectionMatrix = perspective(fovy, aspect, near, far);

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    
    theta[0] += x_rotateSpeed;
    theta[1] += y_rotateSpeed;
    theta[2] += z_rotateSpeed;

    gl.uniform3fv(uTheta, theta);

    renderCoordinate();
    renderRubic();
    renderGrid();

    requestAnimationFrame(render);
}