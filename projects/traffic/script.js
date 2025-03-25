document.addEventListener('DOMContentLoaded', function () {
  // Get the SVG element
  const svg = document.getElementById('intersection');
  const svgNS = "http://www.w3.org/2000/svg";

  // Set up dimensions and parameters
  const width = 800;
  const height = 600;
  const roadWidth = 120;
  const laneWidth = roadWidth / 4;
  const centerX = width / 2;
  const centerY = height / 2;

  // Traffic statistics tracking
  let trafficStats = {
    lastSignalChangeTime: Date.now(),
    firstCarStopTime: null,
    stoppedCarsCount: 0,
    totalCarsPassed: 0,
    simulationStartTime: Date.now(),
    totalWaitTime: 0,
    carsWaited: 0,
    avgWaitTime: 0,
    totalCarsApproached: 0
  };

  // Variable for stats reporting interval
  let statsInterval;

  // Draw background (grass)
  const grass = document.createElementNS(svgNS, "rect");
  grass.setAttribute("x", 0);
  grass.setAttribute("y", 0);
  grass.setAttribute("width", width);
  grass.setAttribute("height", height);
  grass.setAttribute("class", "grass");
  svg.appendChild(grass);

  // Draw horizontal road
  const horizontalRoad = document.createElementNS(svgNS, "rect");
  horizontalRoad.setAttribute("x", 0);
  horizontalRoad.setAttribute("y", centerY - roadWidth / 2);
  horizontalRoad.setAttribute("width", width);
  horizontalRoad.setAttribute("height", roadWidth);
  horizontalRoad.setAttribute("class", "road");
  svg.appendChild(horizontalRoad);

  // Draw vertical road
  const verticalRoad = document.createElementNS(svgNS, "rect");
  verticalRoad.setAttribute("x", centerX - roadWidth / 2);
  verticalRoad.setAttribute("y", 0);
  verticalRoad.setAttribute("width", roadWidth);
  verticalRoad.setAttribute("height", height);
  verticalRoad.setAttribute("class", "road");
  svg.appendChild(verticalRoad);

  // Draw sidewalks
  // Top left
  drawSidewalk(0, 0, centerX - roadWidth / 2, centerY - roadWidth / 2);
  // Top right
  drawSidewalk(centerX + roadWidth / 2, 0, width - (centerX + roadWidth / 2), centerY - roadWidth / 2);
  // Bottom left
  drawSidewalk(0, centerY + roadWidth / 2, centerX - roadWidth / 2, height - (centerY + roadWidth / 2));
  // Bottom right
  drawSidewalk(centerX + roadWidth / 2, centerY + roadWidth / 2, width - (centerX + roadWidth / 2), height - (centerY + roadWidth / 2));

  // Draw road markings
  // Horizontal road center line
  drawRoadMarking(0, centerY, width, centerY);

  // Vertical road center line
  drawRoadMarking(centerX, 0, centerX, height);

  // Horizontal road lane markings
  drawRoadMarking(0, centerY - laneWidth, width, centerY - laneWidth, true);
  drawRoadMarking(0, centerY + laneWidth, width, centerY + laneWidth, true);

  // Vertical road lane markings
  drawRoadMarking(centerX - laneWidth, 0, centerX - laneWidth, height, true);
  drawRoadMarking(centerX + laneWidth, 0, centerX + laneWidth, height, true);

  // Draw crosswalks around the intersection
  // Top crosswalk
  drawCrosswalk(centerX - roadWidth / 2, centerY - roadWidth / 2 - 20, roadWidth, 15, false);
  // Right crosswalk
  drawCrosswalk(centerX + roadWidth / 2 + 5, centerY - roadWidth / 2, 15, roadWidth, true);
  // Bottom crosswalk
  drawCrosswalk(centerX - roadWidth / 2, centerY + roadWidth / 2 + 5, roadWidth, 15, false);
  // Left crosswalk
  drawCrosswalk(centerX - roadWidth / 2 - 20, centerY - roadWidth / 2, 15, roadWidth, true);

  // Add directional arrows to indicate traffic flow
  // Westbound arrows (top two lanes)
  drawDirectionalArrow(width / 4, centerY - roadWidth / 4, 'west');
  drawDirectionalArrow(width / 4, centerY - roadWidth / 4 - laneWidth, 'west');
  drawDirectionalArrow(3 * width / 4, centerY - roadWidth / 4, 'west');
  drawDirectionalArrow(3 * width / 4, centerY - roadWidth / 4 - laneWidth, 'west');

  // Eastbound arrows (bottom two lanes)
  drawDirectionalArrow(width / 4, centerY + roadWidth / 4, 'east');
  drawDirectionalArrow(width / 4, centerY + roadWidth / 4 + laneWidth, 'east');
  drawDirectionalArrow(3 * width / 4, centerY + roadWidth / 4, 'east');
  drawDirectionalArrow(3 * width / 4, centerY + roadWidth / 4 + laneWidth, 'east');

  // Northbound arrows (right two lanes)
  drawDirectionalArrow(centerX + roadWidth / 4, height / 4, 'north');
  drawDirectionalArrow(centerX + roadWidth / 4 + laneWidth, height / 4, 'north');
  drawDirectionalArrow(centerX + roadWidth / 4, 3 * height / 4, 'north');
  drawDirectionalArrow(centerX + roadWidth / 4 + laneWidth, 3 * height / 4, 'north');

  // Southbound arrows (left two lanes)
  drawDirectionalArrow(centerX - roadWidth / 4, height / 4, 'south');
  drawDirectionalArrow(centerX - roadWidth / 4 - laneWidth, height / 4, 'south');
  drawDirectionalArrow(centerX - roadWidth / 4, 3 * height / 4, 'south');
  drawDirectionalArrow(centerX - roadWidth / 4 - laneWidth, 3 * height / 4, 'south');

  // Initialize traffic light state
  let trafficLightState = {
    northSouth: 'green',
    eastWest: 'red'
  };

  // Initialize cars
  const cars = [];
  let trafficRunning = false;

  // Draw traffic lights
  // Top
  drawTrafficLight(centerX + roadWidth / 2 + 10, centerY - roadWidth / 2 - 30, 'vertical');
  // Right
  drawTrafficLight(centerX + roadWidth / 2 + 30, centerY + roadWidth / 2 + 10, 'horizontal');
  // Bottom
  drawTrafficLight(centerX - roadWidth / 2 - 10, centerY + roadWidth / 2 + 30, 'vertical');
  // Left
  drawTrafficLight(centerX - roadWidth / 2 - 30, centerY - roadWidth / 2 - 10, 'horizontal');

  // Initialize traffic light state immediately after drawing
  updateTrafficLights('green', 'red');

  // Toggle traffic lights
  document.getElementById('toggleLights').addEventListener('click', function () {
    if (trafficLightState.northSouth === 'green') {
      // Change to yellow for north-south
      updateTrafficLights('yellow', 'red');

      // After 2 seconds, change to red for north-south and green for east-west
      setTimeout(function () {
        updateTrafficLights('red', 'green');
      }, 2000);
    } else if (trafficLightState.northSouth === 'red') {
      // Change to yellow for east-west
      updateTrafficLights('red', 'yellow');

      // After 2 seconds, change to green for north-south and red for east-west
      setTimeout(function () {
        updateTrafficLights('green', 'red');
      }, 2000);
    }
  });

  // Toggle traffic flow
  document.getElementById('toggleTraffic').addEventListener('click', function () {
    trafficRunning = !trafficRunning;

    if (trafficRunning) {
      this.textContent = 'Stop Traffic';
      startTraffic();
    } else {
      this.textContent = 'Start Traffic';
      stopTraffic();
    }
  });

  // Function to draw a sidewalk
  function drawSidewalk(x, y, width, height) {
    const sidewalk = document.createElementNS(svgNS, "rect");
    sidewalk.setAttribute("x", x);
    sidewalk.setAttribute("y", y);
    sidewalk.setAttribute("width", width);
    sidewalk.setAttribute("height", height);
    sidewalk.setAttribute("class", "sidewalk");
    svg.appendChild(sidewalk);
  }

  // Function to draw crosswalks
  function drawCrosswalk(x, y, width, height, isHorizontal) {
    const stripeWidth = 5;
    const stripeGap = 5;
    const group = document.createElementNS(svgNS, "g");
    group.setAttribute("class", "crosswalk");

    if (isHorizontal) {
      // Draw horizontal crosswalk (stripes going up and down)
      for (let i = 0; i < width; i += stripeWidth + stripeGap) {
        if (i + stripeWidth > width) continue; // Skip if stripe would go beyond crosswalk width

        const stripe = document.createElementNS(svgNS, "rect");
        stripe.setAttribute("x", x + i);
        stripe.setAttribute("y", y);
        stripe.setAttribute("width", stripeWidth);
        stripe.setAttribute("height", height);
        stripe.setAttribute("fill", "white");
        group.appendChild(stripe);
      }
    } else {
      // Draw vertical crosswalk (stripes going left and right)
      for (let i = 0; i < height; i += stripeWidth + stripeGap) {
        if (i + stripeWidth > height) continue; // Skip if stripe would go beyond crosswalk height

        const stripe = document.createElementNS(svgNS, "rect");
        stripe.setAttribute("x", x);
        stripe.setAttribute("y", y + i);
        stripe.setAttribute("width", width);
        stripe.setAttribute("height", stripeWidth);
        stripe.setAttribute("fill", "white");
        group.appendChild(stripe);
      }
    }

    svg.appendChild(group);
  }

  // Function to draw road markings
  function drawRoadMarking(x1, y1, x2, y2, dashed = false) {
    // Check if this line passes through the intersection area
    const linePassesThroughIntersection =
      // Vertical line passing through intersection
      ((x1 === x2) && (x1 >= centerX - roadWidth / 2) && (x1 <= centerX + roadWidth / 2) &&
        ((y1 <= centerY - roadWidth / 2 && y2 >= centerY - roadWidth / 2) ||
          (y1 >= centerY - roadWidth / 2 && y1 <= centerY + roadWidth / 2) ||
          (y2 >= centerY - roadWidth / 2 && y2 <= centerY + roadWidth / 2) ||
          (y1 <= centerY + roadWidth / 2 && y2 >= centerY + roadWidth / 2))) ||
      // Horizontal line passing through intersection
      ((y1 === y2) && (y1 >= centerY - roadWidth / 2) && (y1 <= centerY + roadWidth / 2) &&
        ((x1 <= centerX - roadWidth / 2 && x2 >= centerX - roadWidth / 2) ||
          (x1 >= centerX - roadWidth / 2 && x1 <= centerX + roadWidth / 2) ||
          (x2 >= centerX - roadWidth / 2 && x2 <= centerX + roadWidth / 2) ||
          (x1 <= centerX + roadWidth / 2 && x2 >= centerX + roadWidth / 2)));

    if (linePassesThroughIntersection) {

      // Draw two segments instead - one before and one after the intersection
      if (x1 === x2) { // Vertical line
        // Define crosswalk positions
        const topCrosswalkY = centerY - roadWidth / 2 - 20;
        const bottomCrosswalkY = centerY + roadWidth / 2 + 5;

        // Before intersection - stop at top crosswalk
        if (y1 < topCrosswalkY) {
          const line1 = document.createElementNS(svgNS, "line");
          line1.setAttribute("x1", x1);
          line1.setAttribute("y1", y1);
          line1.setAttribute("x2", x2);
          line1.setAttribute("y2", topCrosswalkY);

          if (dashed) {
            line1.setAttribute("class", "road-marking");
          } else {
            line1.setAttribute("class", "road-marking-solid");
          }

          svg.appendChild(line1);
        }

        // After intersection - start after bottom crosswalk
        if (y2 > bottomCrosswalkY + 15) { // Add crosswalk height (15px)
          const line2 = document.createElementNS(svgNS, "line");
          line2.setAttribute("x1", x1);
          line2.setAttribute("y1", bottomCrosswalkY + 15);
          line2.setAttribute("x2", x2);
          line2.setAttribute("y2", y2);

          if (dashed) {
            line2.setAttribute("class", "road-marking");
          } else {
            line2.setAttribute("class", "road-marking-solid");
          }

          svg.appendChild(line2);
        }
      } else { // Horizontal line
        // Define crosswalk positions
        const leftCrosswalkX = centerX - roadWidth / 2 - 20;
        const rightCrosswalkX = centerX + roadWidth / 2 + 5;

        // Before intersection - stop at left crosswalk
        if (x1 < leftCrosswalkX) {
          const line1 = document.createElementNS(svgNS, "line");
          line1.setAttribute("x1", x1);
          line1.setAttribute("y1", y1);
          line1.setAttribute("x2", leftCrosswalkX);
          line1.setAttribute("y2", y2);

          if (dashed) {
            line1.setAttribute("class", "road-marking");
          } else {
            line1.setAttribute("class", "road-marking-solid");
          }

          svg.appendChild(line1);
        }

        // After intersection - start after right crosswalk
        if (x2 > rightCrosswalkX + 15) { // Add crosswalk width (15px)
          const line2 = document.createElementNS(svgNS, "line");
          line2.setAttribute("x1", rightCrosswalkX + 15);
          line2.setAttribute("y1", y1);
          line2.setAttribute("x2", x2);
          line2.setAttribute("y2", y2);

          if (dashed) {
            line2.setAttribute("class", "road-marking");
          } else {
            line2.setAttribute("class", "road-marking-solid");
          }

          svg.appendChild(line2);
        }
      }
      return;
    }

    const line = document.createElementNS(svgNS, "line");
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);

    if (dashed) {
      line.setAttribute("class", "road-marking");
    } else {
      line.setAttribute("class", "road-marking-solid");
    }

    svg.appendChild(line);
  }

  // Function to draw directional arrows
  function drawDirectionalArrow(x, y, direction) {
    const arrowSize = 10;
    const group = document.createElementNS(svgNS, "g");

    // Create arrow based on direction
    let points;

    switch (direction) {
      case 'north':
        points = `${x},${y - arrowSize} ${x - arrowSize / 2},${y} ${x + arrowSize / 2},${y}`;
        break;
      case 'south':
        points = `${x},${y + arrowSize} ${x - arrowSize / 2},${y} ${x + arrowSize / 2},${y}`;
        break;
      case 'east':
        points = `${x + arrowSize},${y} ${x},${y - arrowSize / 2} ${x},${y + arrowSize / 2}`;
        break;
      case 'west':
        points = `${x - arrowSize},${y} ${x},${y - arrowSize / 2} ${x},${y + arrowSize / 2}`;
        break;
    }

    const arrow = document.createElementNS(svgNS, "polygon");
    arrow.setAttribute("points", points);
    arrow.setAttribute("fill", "#fff");
    arrow.setAttribute("stroke", "none");

    group.appendChild(arrow);
    svg.appendChild(group);
  }

  // Function to draw traffic lights
  function drawTrafficLight(x, y, orientation) {
    const group = document.createElementNS(svgNS, "g");
    group.setAttribute("class", "traffic-light");
    group.setAttribute("data-orientation", orientation);

    const housing = document.createElementNS(svgNS, "rect");
    let width, height;

    if (orientation === 'vertical') {
      width = 14;
      height = 40;
    } else {
      width = 40;
      height = 14;
    }

    housing.setAttribute("x", x - width / 2);
    housing.setAttribute("y", y - height / 2);
    housing.setAttribute("width", width);
    housing.setAttribute("height", height);
    housing.setAttribute("fill", "#333");
    group.appendChild(housing);

    // Add lights
    if (orientation === 'vertical') {
      // Red light
      const redLight = document.createElementNS(svgNS, "circle");
      redLight.setAttribute("cx", x);
      redLight.setAttribute("cy", y - 12);
      redLight.setAttribute("r", 5);
      redLight.setAttribute("class", "traffic-light-red");
      // Set initial dimmed color directly
      redLight.style.fill = "#550000";
      group.appendChild(redLight);

      // Yellow light
      const yellowLight = document.createElementNS(svgNS, "circle");
      yellowLight.setAttribute("cx", x);
      yellowLight.setAttribute("cy", y);
      yellowLight.setAttribute("r", 5);
      yellowLight.setAttribute("class", "traffic-light-yellow");
      // Set initial dimmed color directly
      yellowLight.style.fill = "#554400";
      group.appendChild(yellowLight);

      // Green light
      const greenLight = document.createElementNS(svgNS, "circle");
      greenLight.setAttribute("cx", x);
      greenLight.setAttribute("cy", y + 12);
      greenLight.setAttribute("r", 5);
      greenLight.setAttribute("class", "traffic-light-green");
      // Set initial dimmed color directly
      greenLight.style.fill = "#004400";
      group.appendChild(greenLight);
    } else {
      // Red light
      const redLight = document.createElementNS(svgNS, "circle");
      redLight.setAttribute("cx", x - 12);
      redLight.setAttribute("cy", y);
      redLight.setAttribute("r", 5);
      redLight.setAttribute("class", "traffic-light-red");
      // Set initial dimmed color directly
      redLight.style.fill = "#550000";
      group.appendChild(redLight);

      // Yellow light
      const yellowLight = document.createElementNS(svgNS, "circle");
      yellowLight.setAttribute("cx", x);
      yellowLight.setAttribute("cy", y);
      yellowLight.setAttribute("r", 5);
      yellowLight.setAttribute("class", "traffic-light-yellow");
      // Set initial dimmed color directly
      yellowLight.style.fill = "#554400";
      group.appendChild(yellowLight);

      // Green light
      const greenLight = document.createElementNS(svgNS, "circle");
      greenLight.setAttribute("cx", x + 12);
      greenLight.setAttribute("cy", y);
      greenLight.setAttribute("r", 5);
      greenLight.setAttribute("class", "traffic-light-green");
      // Set initial dimmed color directly
      greenLight.style.fill = "#004400";
      group.appendChild(greenLight);
    }

    svg.appendChild(group);
  }

  // Function to update traffic lights
  function updateTrafficLights(nsState, ewState) {
    trafficLightState.northSouth = nsState;
    trafficLightState.eastWest = ewState;

    // Reset statistics for new signal cycle
    trafficStats.lastSignalChangeTime = Date.now();
    trafficStats.firstCarStopTime = null;
    trafficStats.stoppedCarsCount = 0;

    // Report statistics when signal changes
    reportTrafficStats();

    // Define colors
    const brightRed = "#ff0000";
    const dimmedRed = "#550000";
    const brightYellow = "#ffcc00";
    const dimmedYellow = "#554400";
    const brightGreen = "#00cc00";
    const dimmedGreen = "#004400";

    // Update north-south traffic lights
    const verticalLights = document.querySelectorAll('.traffic-light[data-orientation="vertical"]');
    console.log('Found vertical lights:', verticalLights.length);

    verticalLights.forEach(function (light, index) {
      const redLight = light.querySelector('.traffic-light-red');
      const yellowLight = light.querySelector('.traffic-light-yellow');
      const greenLight = light.querySelector('.traffic-light-green');

      console.log(`Vertical light ${index} - Found red:`, !!redLight, 'yellow:', !!yellowLight, 'green:', !!greenLight);

      // Force style attribute to override any CSS
      redLight.style.fill = dimmedRed;
      yellowLight.style.fill = dimmedYellow;
      greenLight.style.fill = dimmedGreen;

      // Then set the active light to bright
      if (nsState === 'green') {
        greenLight.style.fill = brightGreen;
      } else if (nsState === 'red') {
        redLight.style.fill = brightRed;
      } else if (nsState === 'yellow') {
        yellowLight.style.fill = brightYellow;
      }
    });

    // Update east-west traffic lights
    const horizontalLights = document.querySelectorAll('.traffic-light[data-orientation="horizontal"]');
    console.log('Found horizontal lights:', horizontalLights.length);

    horizontalLights.forEach(function (light, index) {
      const redLight = light.querySelector('.traffic-light-red');
      const yellowLight = light.querySelector('.traffic-light-yellow');
      const greenLight = light.querySelector('.traffic-light-green');

      console.log(`Horizontal light ${index} - Found red:`, !!redLight, 'yellow:', !!yellowLight, 'green:', !!greenLight);

      // Force style attribute to override any CSS
      redLight.style.fill = dimmedRed;
      yellowLight.style.fill = dimmedYellow;
      greenLight.style.fill = dimmedGreen;

      // Then set the active light to bright
      if (ewState === 'green') {
        greenLight.style.fill = brightGreen;
      } else if (ewState === 'red') {
        redLight.style.fill = brightRed;
      } else if (ewState === 'yellow') {
        yellowLight.style.fill = brightYellow;
      }
    });

    // Car indicators have been removed
  }

  // Traffic lights already initialized above

  // Function to create a car
  function createCar(direction, lane) {
    // Create a group for the car
    const carGroup = document.createElementNS(svgNS, "g");
    carGroup.setAttribute("class", "car-group");

    // Create a group for the car body and details
    const carBody = document.createElementNS(svgNS, "g");
    let x, y, carWidth, carHeight, color, speed;

    // Random color for the car
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff9900', '#9900ff', '#663399', '#336699', '#993366', '#669933'];
    color = colors[Math.floor(Math.random() * colors.length)];

    // Set car dimensions
    carWidth = 20;
    carHeight = 32;

    // Set initial position and speed based on direction
    switch (direction) {
      case 'north': // Cars going north should be in right 2 lanes
        x = centerX + laneWidth / 2 - carWidth / 2 + (lane * laneWidth);
        y = height;
        // Random speed between -1.7 and -2.3
        speed = -2 + (Math.random() * 0.6 - 0.3);
        break;
      case 'south': // Cars going south should be in left 2 lanes
        x = centerX - laneWidth / 2 - carWidth / 2 - (lane * laneWidth);
        y = -carHeight;
        // Random speed between 1.7 and 2.3
        speed = 2 + (Math.random() * 0.6 - 0.3);
        break;
      case 'east': // Cars going east should be in bottom 2 lanes
        x = 0; // Start at the left edge of the screen instead of off-screen
        y = centerY + laneWidth / 2 - carHeight / 2 + (lane * laneWidth);
        // Random speed between 1.7 and 2.3
        speed = 2 + (Math.random() * 0.6 - 0.3);
        // Swap dimensions for horizontal cars
        [carWidth, carHeight] = [carHeight, carWidth];
        break;
      case 'west': // Cars going west should be in top 2 lanes
        x = width;
        y = centerY - laneWidth / 2 - carHeight / 2 - (lane * laneWidth);
        // Random speed between -1.7 and -2.3
        speed = -2 + (Math.random() * 0.6 - 0.3);
        // Swap dimensions for horizontal cars
        [carWidth, carHeight] = [carHeight, carWidth];
        break;
    }

    // Create the car using the provided SVG path
    const carPath = document.createElementNS(svgNS, "path");

    // The SVG path data for the car
    const pathData = "M42.3 110.94c2.22 24.11 2.48 51.07 1.93 79.75-13.76.05-24.14 1.44-32.95 6.69-4.96 2.96-8.38 6.28-10.42 12.15-1.37 4.3-.36 7.41 2.31 8.48 4.52 1.83 22.63-.27 28.42-1.54 2.47-.54 4.53-1.28 5.44-2.33.55-.63 1-1.4 1.35-2.31 1.49-3.93.23-8.44 3.22-12.08.73-.88 1.55-1.37 2.47-1.61-1.46 62.21-6.21 131.9-2.88 197.88 0 43.41 1 71.27 43.48 97.95 41.46 26.04 117.93 25.22 155.25-8.41 32.44-29.23 30.38-50.72 30.38-89.54 5.44-70.36 1.21-134.54-.79-197.69.69.28 1.32.73 1.89 1.42 2.99 3.64 1.73 8.15 3.22 12.08.35.91.8 1.68 1.35 2.31.91 1.05 2.97 1.79 5.44 2.33 5.79 1.27 23.9 3.37 28.42 1.54 2.67-1.07 3.68-4.18 2.31-8.48-2.04-5.87-5.46-9.19-10.42-12.15-8.7-5.18-18.93-6.6-32.44-6.69-.75-25.99-1.02-51.83-.01-77.89C275.52-48.32 29.74-25.45 42.3 110.94zm69.63-90.88C83.52 30.68 62.75 48.67 54.36 77.59c21.05-15.81 47.13-39.73 57.57-57.53zm89.14-4.18c28.41 10.62 49.19 28.61 57.57 57.53-21.05-15.81-47.13-39.73-57.57-57.53zM71.29 388.22l8.44-24.14c53.79 8.36 109.74 7.72 154.36-.15l7.61 22.8c-60.18 28.95-107.37 32.1-170.41 1.49zm185.26-34.13c5.86-34.1 4.8-86.58-1.99-120.61-12.64 47.63-9.76 74.51 1.99 120.61zM70.18 238.83l-10.34-47.2c45.37-57.48 148.38-53.51 193.32 0l-12.93 47.2c-57.58-14.37-114.19-13.21-170.05 0zM56.45 354.09c-5.86-34.1-4.8-86.58 1.99-120.61 12.63 47.63 9.76 74.51-1.99 120.61z";

    carPath.setAttribute("d", pathData);
    carPath.setAttribute("fill", color);
    carPath.setAttribute("stroke", "#000");
    carPath.setAttribute("stroke-width", "0.5");
    carPath.setAttribute("stroke-miterlimit", "22.926");

    // Scale and position the car
    let scale, translateX, translateY, rotation;

    if (direction === 'north') {
      // For north-facing cars, rotate 180 degrees
      scale = 0.06;
      rotation = 0;
      translateX = x + carWidth / 2;
      translateY = y + carHeight / 2;
    } else if (direction === 'south') {
      // For south-facing cars, no rotation needed
      scale = 0.06;
      rotation = 180;
      translateX = x + carWidth / 2;
      translateY = y + carHeight / 2;
    } else if (direction === 'east') {
      // For east-facing cars, rotate 90 degrees
      scale = 0.06;
      rotation = 90;
      translateX = x + carHeight / 2;
      translateY = y + carWidth / 2;
    } else { // west
      // For west-facing cars, rotate 270 degrees
      scale = 0.06;
      rotation = 270;
      translateX = x + carHeight / 2;
      translateY = y + carWidth / 2;
    }

    // Apply transformations
    carPath.setAttribute("transform", `translate(${translateX}, ${translateY}) scale(${scale}) rotate(${rotation}) translate(-156.5, -256.26)`);

    carBody.appendChild(carPath);

    carGroup.appendChild(carBody);

    svg.appendChild(carGroup);

    return {
      group: carGroup,
      element: carBody, // Now using carBody instead of car
      direction,
      lane,
      speed,
      x,
      y,
      width: carWidth,
      height: carHeight,
      isStopped: false,  // Track if car is currently stopped
      shouldStop: false, // Whether car should stop
      stopX: undefined,  // Where to stop on X axis
      stopY: undefined,  // Where to stop on Y axis
      reactionDelay: 0,  // Delay before car starts moving (driver reaction time)
      hasApproached: false // Track if this car has been counted as approaching the intersection
    };
  }

  // Function to move cars
  function moveCars() {
    // First pass: Detect and resolve any existing collisions before moving cars
    resolveCollisions();
    // First pass: Determine which cars should stop at red lights or behind other cars
    for (let i = 0; i < cars.length; i++) {
      const car = cars[i];

      // Skip cars that are already stopped to prevent jiggling
      if (car.isStopped) {
        continue;
      }

      // Default state - car should move
      let shouldStop = false;
      let stopPositionX = undefined;
      let stopPositionY = undefined;

      // Traffic light state check (indicator removed)
      const canProceed = (car.direction === 'north' || car.direction === 'south') ?
        trafficLightState.northSouth === 'green' :
        trafficLightState.eastWest === 'green';

      // Define crosswalk positions
      const topCrosswalkY = centerY - roadWidth / 2 - 20;
      const bottomCrosswalkY = centerY + roadWidth / 2 + 5;
      const leftCrosswalkX = centerX - roadWidth / 2 - 20;
      const rightCrosswalkX = centerX + roadWidth / 2 + 5;

      // Check if car is approaching a crosswalk or intersection
      const approachingCrosswalk = (
        (car.direction === 'north' && car.y <= bottomCrosswalkY + 150 && car.y > bottomCrosswalkY) ||
        (car.direction === 'south' && car.y >= topCrosswalkY - car.height - 150 && car.y < topCrosswalkY - car.height) ||
        (car.direction === 'east' && car.x >= leftCrosswalkX - car.width - 150 && car.x < leftCrosswalkX - car.width) ||
        (car.direction === 'west' && car.x <= rightCrosswalkX + 150 && car.x > rightCrosswalkX)
      );

      // Safety check - if this car is already at a stop position, ensure it stays stopped
      if (car.isStopped) {
        shouldStop = true;
      }

      // Check if car should stop at red light
      if (approachingCrosswalk) {
        if ((car.direction === 'north' || car.direction === 'south') && trafficLightState.northSouth === 'red') {
          shouldStop = true;

          // Generate a random offset for stopping at traffic lights if not already set
          if (!car.lightStopOffset) {
            // Random offset between -5 and +5 pixels
            car.lightStopOffset = Math.floor(Math.random() * 10) - 5;
          }

          if (car.direction === 'north') {
            // Stop before bottom crosswalk with random offset
            stopPositionY = Math.round(bottomCrosswalkY + 15 + car.lightStopOffset); // Stop after crosswalk with variation
          } else { // south
            // Stop before top crosswalk with random offset
            stopPositionY = Math.round(topCrosswalkY - car.height + car.lightStopOffset); // Stop before crosswalk with variation
          }
        } else if ((car.direction === 'east' || car.direction === 'west') && trafficLightState.eastWest === 'red') {
          shouldStop = true;

          // Generate a random offset for stopping at traffic lights if not already set
          if (!car.lightStopOffset) {
            // Random offset between -5 and +5 pixels
            car.lightStopOffset = Math.floor(Math.random() * 10) - 5;
          }

          if (car.direction === 'east') {
            // Stop before left crosswalk with random offset
            stopPositionX = Math.round(leftCrosswalkX - car.width + car.lightStopOffset); // Stop before crosswalk with variation
          } else { // west
            // Stop before right crosswalk with random offset
            stopPositionX = Math.round(rightCrosswalkX + 15 + car.lightStopOffset); // Stop after crosswalk with variation
          }
        }
      }

      // Check for cars ahead
      for (let j = 0; j < cars.length; j++) {
        if (i === j) continue; // Skip self

        const otherCar = cars[j];
        if (car.direction !== otherCar.direction || car.lane !== otherCar.lane) continue; // Only check cars in same direction and lane

        // If the other car is stopped or should stop, this car should also prepare to stop
        const otherCarIsStopped = otherCar.shouldStop || otherCar.isStopped;

        // Generate a random gap for this car if it doesn't have one yet
        if (!car.randomGap) {
          // Random gap between 25 and 45 pixels - increased to prevent stacking
          car.randomGap = Math.floor(Math.random() * 20) + 25;
        }

        const safeGap = car.randomGap; // Use the car's random gap
        const slowdownDistance = 400; // Further increased distance at which cars start slowing down

        if (car.direction === 'north') {
          // For northbound cars, this car is behind if it has a higher y value
          if (car.y > otherCar.y) {
            // Calculate distance between cars
            const distance = car.y - (otherCar.y + otherCar.height);

            // If the other car is stopped/stopping, we need to queue behind it regardless of distance
            if (otherCarIsStopped || distance < slowdownDistance) {
              // Mark for gradual slowdown - more aggressive slowdown if other car is stopped
              car.slowdownFactor = otherCarIsStopped ?
                Math.max(0.05, distance / (slowdownDistance * 2)) : // Slower approach to stopped cars
                Math.max(0.1, distance / slowdownDistance);        // Normal approach to moving cars

              // If other car is stopped or we're too close, stop completely
              if (otherCarIsStopped || distance < safeGap) {
                shouldStop = true;
                const newStopY = Math.round(otherCar.y + otherCar.height + safeGap);
                // Only update if the new stop position is further back than the current one
                if (stopPositionY === undefined || newStopY > stopPositionY) {
                  stopPositionY = newStopY;
                }

                // Emergency stop if too close to prevent stacking
                if (distance < safeGap / 2) {
                  // Force immediate repositioning to maintain minimum safe gap
                  car.y = otherCar.y + otherCar.height + safeGap;
                  car.shouldStop = true;
                  car.isStopped = true;

                  // Update visual position immediately
                  const carPath = car.element.firstChild;
                  const translateX = car.x + car.width / 2;
                  const translateY = car.y + car.height / 2;
                  const rotation = car.direction === 'north' ? 0 : 180;
                  carPath.setAttribute("transform", `translate(${translateX}, ${translateY}) scale(0.06) rotate(${rotation}) translate(-156.5, -256.26)`);
                }
              }
            }
          }
        } else if (car.direction === 'south') {
          // For southbound cars, this car is behind if it has a lower y value
          if (car.y < otherCar.y) {
            // Calculate distance between cars
            const distance = otherCar.y - (car.y + car.height);

            // If the other car is stopped/stopping, we need to queue behind it regardless of distance
            if (otherCarIsStopped || distance < slowdownDistance) {
              // Mark for gradual slowdown - more aggressive slowdown if other car is stopped
              car.slowdownFactor = otherCarIsStopped ?
                Math.max(0.05, distance / (slowdownDistance * 2)) : // Slower approach to stopped cars
                Math.max(0.1, distance / slowdownDistance);        // Normal approach to moving cars

              // If other car is stopped or we're too close, stop completely
              if (otherCarIsStopped || distance < safeGap) {
                shouldStop = true;
                const newStopY = Math.round(otherCar.y - car.height - safeGap);
                // Only update if the new stop position is further back than the current one
                if (stopPositionY === undefined || newStopY < stopPositionY) {
                  stopPositionY = newStopY;
                }

                // Emergency stop if too close to prevent stacking
                if (distance < safeGap / 2) {
                  // Force immediate repositioning to maintain minimum safe gap
                  car.y = otherCar.y - car.height - safeGap;
                  car.shouldStop = true;
                  car.isStopped = true;

                  // Update visual position immediately
                  const carPath = car.element.firstChild;
                  const translateX = car.x + car.width / 2;
                  const translateY = car.y + car.height / 2;
                  const rotation = car.direction === 'south' ? 180 : 0;
                  carPath.setAttribute("transform", `translate(${translateX}, ${translateY}) scale(0.06) rotate(${rotation}) translate(-156.5, -256.26)`);
                }
              }
            }
          }
        } else if (car.direction === 'east') {
          // For eastbound cars, this car is behind if it has a lower x value
          if (car.x < otherCar.x) {
            // Calculate distance between cars
            const distance = otherCar.x - (car.x + car.width);

            // If the other car is stopped/stopping, we need to queue behind it regardless of distance
            if (otherCarIsStopped || distance < slowdownDistance) {
              // Mark for gradual slowdown - more aggressive slowdown if other car is stopped
              car.slowdownFactor = otherCarIsStopped ?
                Math.max(0.05, distance / (slowdownDistance * 2)) : // Slower approach to stopped cars
                Math.max(0.1, distance / slowdownDistance);        // Normal approach to moving cars

              // If other car is stopped or we're too close, stop completely
              if (otherCarIsStopped || distance < safeGap) {
                shouldStop = true;
                const newStopX = Math.round(otherCar.x - car.width - safeGap);
                // Only update if the new stop position is further back than the current one
                if (stopPositionX === undefined || newStopX < stopPositionX) {
                  stopPositionX = newStopX;
                }

                // Emergency stop if too close to prevent stacking
                if (distance < safeGap / 2) {
                  // Force immediate repositioning to maintain minimum safe gap
                  car.x = otherCar.x - car.width - safeGap;
                  car.shouldStop = true;
                  car.isStopped = true;

                  // Update visual position immediately
                  const carPath = car.element.firstChild;
                  const translateX = car.x + car.width / 2;
                  const translateY = car.y + car.height / 2;
                  const rotation = car.direction === 'east' ? 90 : 270;
                  carPath.setAttribute("transform", `translate(${translateX}, ${translateY}) scale(0.06) rotate(${rotation}) translate(-156.5, -256.26)`);
                }
              }
            }
          }
        } else if (car.direction === 'west') {
          // For westbound cars, this car is behind if it has a higher x value
          if (car.x > otherCar.x) {
            // Calculate distance between cars
            const distance = car.x - (otherCar.x + otherCar.width);

            // If the other car is stopped/stopping, we need to queue behind it regardless of distance
            if (otherCarIsStopped || distance < slowdownDistance) {
              // Mark for gradual slowdown - more aggressive slowdown if other car is stopped
              car.slowdownFactor = otherCarIsStopped ?
                Math.max(0.05, distance / (slowdownDistance * 2)) : // Slower approach to stopped cars
                Math.max(0.1, distance / slowdownDistance);        // Normal approach to moving cars

              // If other car is stopped or we're too close, stop completely
              if (otherCarIsStopped || distance < safeGap) {
                shouldStop = true;
                const newStopX = Math.round(otherCar.x + otherCar.width + safeGap);
                // Only update if the new stop position is further back than the current one
                if (stopPositionX === undefined || newStopX > stopPositionX) {
                  stopPositionX = newStopX;
                }

                // Emergency stop if too close to prevent stacking
                if (distance < safeGap / 2) {
                  // Force immediate repositioning to maintain minimum safe gap
                  car.x = otherCar.x + otherCar.width + safeGap;
                  car.shouldStop = true;
                  car.isStopped = true;

                  // Update visual position immediately
                  const carPath = car.element.firstChild;
                  const translateX = car.x + car.width / 2;
                  const translateY = car.y + car.height / 2;
                  const rotation = car.direction === 'west' ? 270 : 90;
                  carPath.setAttribute("transform", `translate(${translateX}, ${translateY}) scale(0.06) rotate(${rotation}) translate(-156.5, -256.26)`);
                }
              }
            }
          }
        }
      }

      // Store the decision for this car
      if (shouldStop) {
        // Update the stop position if it's different from the current one
        // This allows cars to properly queue behind other cars that have stopped
        car.shouldStop = true;

        // Only update stop positions if they're different from current ones
        // or if the car doesn't have stop positions yet
        if (car.stopX !== stopPositionX && stopPositionX !== undefined) {
          car.stopX = stopPositionX;
          car.isStopped = false; // Reset stopped flag when stop position changes
        }

        if (car.stopY !== stopPositionY && stopPositionY !== undefined) {
          car.stopY = stopPositionY;
          car.isStopped = false; // Reset stopped flag when stop position changes
        }
      } else {
        // Clear stop flags if car should move
        car.shouldStop = false;
        car.isStopped = false;
        car.stopX = undefined;
        car.stopY = undefined;
      }
    }

    // Second pass: Apply movement or stopping
    // Define intersection boundaries for quick reference
    const topCrosswalkY = centerY - roadWidth / 2 - 20;
    const bottomCrosswalkY = centerY + roadWidth / 2 + 5;
    const leftCrosswalkX = centerX - roadWidth / 2 - 20;
    const rightCrosswalkX = centerX + roadWidth / 2 + 5;

    for (let i = 0; i < cars.length; i++) {
      const car = cars[i];

      // Skip cars that are already stopped to prevent jiggling
      if (car.isStopped) {
        continue;
      }

      // FINAL SAFETY CHECK: Emergency stop for cars about to run red lights
      const isAboutToRunRedLight = (
        (car.direction === 'north' && car.y <= bottomCrosswalkY + 10 && car.y > bottomCrosswalkY && trafficLightState.northSouth === 'red') ||
        (car.direction === 'south' && car.y >= topCrosswalkY - car.height - 10 && car.y < topCrosswalkY - car.height && trafficLightState.northSouth === 'red') ||
        (car.direction === 'east' && car.x >= leftCrosswalkX - car.width - 10 && car.x < leftCrosswalkX - car.width && trafficLightState.eastWest === 'red') ||
        (car.direction === 'west' && car.x <= rightCrosswalkX + 10 && car.x > rightCrosswalkX && trafficLightState.eastWest === 'red')
      );

      if (isAboutToRunRedLight) {
        // Force emergency stop
        if (!car.lightStopOffset) {
          car.lightStopOffset = Math.floor(Math.random() * 10) - 5;
        }

        if (car.direction === 'north') {
          car.y = bottomCrosswalkY + 15 + car.lightStopOffset;
        } else if (car.direction === 'south') {
          car.y = topCrosswalkY - car.height + car.lightStopOffset;
        } else if (car.direction === 'east') {
          car.x = leftCrosswalkX - car.width + car.lightStopOffset;
        } else if (car.direction === 'west') {
          car.x = rightCrosswalkX + 15 + car.lightStopOffset;
        }

        car.shouldStop = true;
        car.isStopped = true;
        continue;
      }

      if (!car.shouldStop) {
        // Apply slowdown factor if car is approaching another car
        const actualSpeed = car.slowdownFactor !== undefined ?
          car.speed * car.slowdownFactor : car.speed;

        // Car should move
        if (car.direction === 'north' || car.direction === 'south') {
          // Apply speed (direction is already handled in the car creation)
          car.y += actualSpeed;

          // Update car position by updating the transform of the SVG path
          const carPath = car.element.firstChild;

          // Calculate new transform values
          let translateX, translateY;
          translateX = car.x + car.width / 2;
          translateY = Math.round(car.y) + car.height / 2;

          // Apply the updated transform
          const rotation = car.direction === 'north' ? 0 : 180;
          carPath.setAttribute("transform", `translate(${translateX}, ${translateY}) scale(0.06) rotate(${rotation}) translate(-156.5, -256.26)`);

          // Indicator position update removed
        } else {
          // Apply speed (direction is already handled in the car creation)
          car.x += actualSpeed;

          // Update car position by updating the transform of the SVG path
          const carPath = car.element.firstChild;

          // Calculate new transform values
          let translateX, translateY;
          translateX = Math.round(car.x) + car.width / 2;
          translateY = car.y + car.height / 2;

          // Apply the updated transform
          const rotation = car.direction === 'east' ? 90 : 270;
          carPath.setAttribute("transform", `translate(${translateX}, ${translateY}) scale(0.06) rotate(${rotation}) translate(-156.5, -256.26)`);

          // Indicator position update removed
        }

        // Reset slowdown factor for next frame
        car.slowdownFactor = undefined;
      } else {
        // Car should stop
        if (!car.isStopped) {
          if (car.direction === 'north' || car.direction === 'south') {
            if (car.stopY !== undefined) {
              // Gradually slow down to stop position
              const roundedStopY = Math.round(car.stopY);
              const distanceToStop = car.direction === 'north' ?
                roundedStopY - car.y : car.y - roundedStopY;

              if (Math.abs(distanceToStop) <= 2) {
                // Close enough to final position - snap to it
                car.y = roundedStopY;

                // Update car position by updating the transform of the SVG path
                const carPath = car.element.firstChild;

                // Calculate new transform values
                let translateX, translateY;
                translateX = car.x + car.width / 2;
                translateY = roundedStopY + car.height / 2;

                // Apply the updated transform
                // Flip north/south cars 180 degrees from current orientation
                let rotation;
                if (car.direction === 'north') {
                  rotation = 0; // Always 180 for north
                } else { // south
                  rotation = 180; // Always 0 for south
                }
                carPath.setAttribute("transform", `translate(${translateX}, ${translateY}) scale(0.06) rotate(${rotation}) translate(-156.5, -256.26)`);

                // Indicator position update removed

                // Mark as stopped
                car.isStopped = true;

                // Track first car stop time if not already set
                if (trafficStats.firstCarStopTime === null) {
                  trafficStats.firstCarStopTime = Date.now();
                }

                // Increment stopped cars count
                trafficStats.stoppedCarsCount++;

                // Report statistics when a car stops
                reportTrafficStats();
              } else {
                // Gradually slow down - move at reduced speed
                const slowdownFactor = Math.min(1, Math.abs(distanceToStop) / 50); // Slow down more as we get closer
                const adjustedSpeed = car.speed * slowdownFactor;

                // Move at reduced speed
                car.y += (car.direction === 'north' ? -1 : 1) * Math.abs(adjustedSpeed);

                // Update car position by updating the transform of the SVG path
                const carPath = car.element.firstChild;

                // Calculate new transform values
                let translateX, translateY;
                translateX = car.x + car.width / 2;
                translateY = Math.round(car.y) + car.height / 2;

                // Apply the updated transform
                // Flip north/south cars 180 degrees from current orientation
                let rotation;
                if (car.direction === 'north') {
                  rotation = 0; // Always 180 for north
                } else { // south
                  rotation = 180; // Always 0 for south
                }
                carPath.setAttribute("transform", `translate(${translateX}, ${translateY}) scale(0.06) rotate(${rotation}) translate(-156.5, -256.26)`);

                // Indicator code removed
                // Indicator position update removed
              }
            }
          } else {
            if (car.stopX !== undefined) {
              // Gradually slow down to stop position
              const roundedStopX = Math.round(car.stopX);
              const distanceToStop = car.direction === 'west' ?
                roundedStopX - car.x : car.x - roundedStopX;

              if (Math.abs(distanceToStop) <= 2) {
                // Close enough to final position - snap to it
                car.x = roundedStopX;

                // Update car position by updating the transform of the SVG path
                const carPath = car.element.firstChild;

                // Calculate new transform values
                let translateX, translateY;
                translateX = roundedStopX + car.width / 2;
                translateY = car.y + car.height / 2;

                // Apply the updated transform
                const rotation = car.direction === 'east' ? 90 : 270;
                carPath.setAttribute("transform", `translate(${translateX}, ${translateY}) scale(0.06) rotate(${rotation}) translate(-156.5, -256.26)`);

                // Indicator position update removed

                // Mark as stopped
                car.isStopped = true;

                // Track first car stop time if not already set
                if (trafficStats.firstCarStopTime === null) {
                  trafficStats.firstCarStopTime = Date.now();
                }

                // Increment stopped cars count
                trafficStats.stoppedCarsCount++;

                // Report statistics when a car stops
                reportTrafficStats();
              } else {
                // Gradually slow down - move at reduced speed
                const slowdownFactor = Math.min(1, Math.abs(distanceToStop) / 50); // Slow down more as we get closer
                const adjustedSpeed = car.speed * slowdownFactor;

                // Move at reduced speed
                car.x += (car.direction === 'west' ? -1 : 1) * Math.abs(adjustedSpeed);

                // Update car position by updating the transform of the SVG path
                const carPath = car.element.firstChild;

                // Calculate new transform values
                let translateX, translateY;
                translateX = Math.round(car.x) + car.width / 2;
                translateY = car.y + car.height / 2;

                // Apply the updated transform
                const rotation = car.direction === 'east' ? 90 : 270;
                carPath.setAttribute("transform", `translate(${translateX}, ${translateY}) scale(0.06) rotate(${rotation}) translate(-156.5, -256.26)`);

                // Indicator code removed
                // Indicator position update removed
              }
            }
          }
        }
        // If already stopped, do nothing to prevent jiggling
      }
    }

  }

  // Function to detect and resolve collisions between cars
  function resolveCollisions() {
    // Check each pair of cars for overlap
    for (let i = 0; i < cars.length; i++) {
      const car1 = cars[i];

      for (let j = i + 1; j < cars.length; j++) {
        const car2 = cars[j];

        // Skip cars that are not in the same lane or direction
        if (car1.direction !== car2.direction || car1.lane !== car2.lane) continue;

        // Check for collision based on direction
        let collision = false;
        let distance = 0;
        const minSafeGap = 20; // Increased minimum safe gap to prevent stacking

        if (car1.direction === 'north' || car1.direction === 'south') {
          // Check for vertical collision
          const car1Bottom = car1.y + car1.height;
          const car2Bottom = car2.y + car2.height;

          // Determine which car is in front
          let frontCar, backCar;
          if (car1.direction === 'north') {
            // Lower y value is in front for northbound
            frontCar = car1.y < car2.y ? car1 : car2;
            backCar = frontCar === car1 ? car2 : car1;
            distance = backCar.y - (frontCar.y + frontCar.height);
          } else { // south
            // Higher y value is in front for southbound
            frontCar = car1.y > car2.y ? car1 : car2;
            backCar = frontCar === car1 ? car2 : car1;
            distance = frontCar.y - (backCar.y + backCar.height);
          }

          // If distance is negative or too small, we have a collision
          if (distance < minSafeGap) {
            collision = true;

            // Resolve collision by moving the back car
            if (car1.direction === 'north') {
              backCar.y = frontCar.y + frontCar.height + minSafeGap;
            } else { // south
              backCar.y = frontCar.y - backCar.height - minSafeGap;
            }

            // Mark the back car as stopped
            backCar.shouldStop = true;
            backCar.isStopped = true;

            // Update the car's visual position
            const carPath = backCar.element.firstChild;
            const translateX = backCar.x + backCar.width / 2;
            const translateY = backCar.y + backCar.height / 2;
            const rotation = backCar.direction === 'north' ? 0 : 180;
            carPath.setAttribute("transform", `translate(${translateX}, ${translateY}) scale(0.06) rotate(${rotation}) translate(-156.5, -256.26)`);

            // Log collision resolution for debugging
            console.log(`Resolved vertical collision: ${backCar.direction} car moved to y=${backCar.y}`);
          }
        } else { // east or west
          // Check for horizontal collision
          const car1Right = car1.x + car1.width;
          const car2Right = car2.x + car2.width;

          // Determine which car is in front
          let frontCar, backCar;
          if (car1.direction === 'east') {
            // Higher x value is in front for eastbound
            frontCar = car1.x > car2.x ? car1 : car2;
            backCar = frontCar === car1 ? car2 : car1;
            distance = frontCar.x - (backCar.x + backCar.width);
          } else { // west
            // Lower x value is in front for westbound
            frontCar = car1.x < car2.x ? car1 : car2;
            backCar = frontCar === car1 ? car2 : car1;
            distance = backCar.x - (frontCar.x + frontCar.width);
          }

          // If distance is negative or too small, we have a collision
          if (distance < minSafeGap) {
            collision = true;

            // Resolve collision by moving the back car
            if (car1.direction === 'east') {
              backCar.x = frontCar.x - backCar.width - minSafeGap;
            } else { // west
              backCar.x = frontCar.x + frontCar.width + minSafeGap;
            }

            // Mark the back car as stopped
            backCar.shouldStop = true;
            backCar.isStopped = true;

            // Update the car's visual position
            const carPath = backCar.element.firstChild;
            const translateX = backCar.x + backCar.width / 2;
            const translateY = backCar.y + backCar.height / 2;
            const rotation = backCar.direction === 'east' ? 90 : 270;
            carPath.setAttribute("transform", `translate(${translateX}, ${translateY}) scale(0.06) rotate(${rotation}) translate(-156.5, -256.26)`);

            // Log collision resolution for debugging
            console.log(`Resolved horizontal collision: ${backCar.direction} car moved to x=${backCar.x}`);
          }
        }
      }
    }
  }

  // Remove cars that have left the screen (unless they're part of a queue)
  function removeOffscreenCars() {
    for (let i = 0; i < cars.length; i++) {
      const car = cars[i];

      // Check if this car is part of a queue (either stopped or should stop)
      let isPartOfQueue = car.shouldStop || car.isStopped;

      // If not already marked as part of a queue, check if there are stopped cars ahead in the same lane
      if (!isPartOfQueue) {
        for (let j = 0; j < cars.length; j++) {
          if (i === j) continue; // Skip self

          const otherCar = cars[j];
          if (car.direction !== otherCar.direction || car.lane !== otherCar.lane) continue;

          // Check if other car is ahead and stopped/stopping
          if ((otherCar.shouldStop || otherCar.isStopped) && (
            (car.direction === 'north' && car.y > otherCar.y) ||
            (car.direction === 'south' && car.y < otherCar.y) ||
            (car.direction === 'east' && car.x < otherCar.x) ||
            (car.direction === 'west' && car.x > otherCar.x)
          )) {
            isPartOfQueue = true;
            break;
          }
        }
      }

      // Only remove the car if it's off-screen AND not part of a queue
      if (
        !isPartOfQueue && (
          car.y < -car.height ||
          car.y > height ||
          car.x < -car.width ||
          car.x > width
        )
      ) {
        // Increment the total cars passed counter
        trafficStats.totalCarsPassed++;

        // Safely remove the car group from the DOM
        if (car.group && car.group.parentNode) {
          car.group.parentNode.removeChild(car.group);
        }
        cars.splice(i, 1);
        i--;
      }
    }
  }

  // Function to add new cars randomly
  function addRandomCar() {
    if (!trafficRunning) return;

    const directions = ['north', 'south', 'east', 'west'];
    const direction = directions[Math.floor(Math.random() * directions.length)];
    const lane = Math.floor(Math.random() * 2); // 0 or 1 for the two lanes in each direction

    cars.push(createCar(direction, lane));

    // Schedule next car
    setTimeout(addRandomCar, Math.random() * 2000 + 1000);
  }

  // Function to start traffic
  function startTraffic() {
    trafficRunning = true;

    // Reset traffic stats
    trafficStats = {
      lastSignalChangeTime: Date.now(),
      firstCarStopTime: null,
      stoppedCarsCount: 0,
      totalCarsPassed: 0,
      simulationStartTime: Date.now(),
      totalWaitTime: 0,
      carsWaited: 0,
      avgWaitTime: 0,
      totalCarsApproached: 0
    };

    // Start animation loop
    animationLoop();

    // Add first car
    setTimeout(addRandomCar, 1000);

    // Start stats reporting every second
    statsInterval = setInterval(reportTrafficStats, 1000);
  }

  // Function to stop traffic
  function stopTraffic() {
    trafficRunning = false;

    // Stop stats reporting
    clearInterval(statsInterval);

    // Remove all cars safely
    for (let i = 0; i < cars.length; i++) {
      const carElement = cars[i].element;
      // Check if the element exists and is actually in the DOM
      if (carElement && carElement.parentNode) {
        carElement.parentNode.removeChild(carElement);
      }
    }
    cars.length = 0;

    // Clear stats display
    const statsContainer = document.getElementById('traffic-stats');
    if (statsContainer) {
      statsContainer.remove();
    }
  }

  // Function to report traffic statistics
  function reportTrafficStats() {
    const now = Date.now();
    const elapsedSinceSignalChange = Math.round((now - trafficStats.lastSignalChangeTime) / 1000);

    let elapsedSinceFirstStop = 0;
    if (trafficStats.firstCarStopTime !== null) {
      elapsedSinceFirstStop = Math.round((now - trafficStats.firstCarStopTime) / 1000);
    }

    // Calculate average cars per minute
    const simulationTimeMinutes = (now - trafficStats.simulationStartTime) / (1000 * 60);
    const carsPerMinute = simulationTimeMinutes > 0 ? parseFloat((trafficStats.totalCarsPassed / simulationTimeMinutes).toFixed(2)) : 0;
    const approachPerMinute = simulationTimeMinutes > 0 ? parseFloat((trafficStats.totalCarsApproached / simulationTimeMinutes).toFixed(2)) : 0;

    const statsReport = {
      'Time since last signal change': elapsedSinceSignalChange,
      'Time since first car stopped': elapsedSinceFirstStop,
      'Number of cars stopped': trafficStats.stoppedCarsCount,
      'Total cars passed': trafficStats.totalCarsPassed,
      'Total cars approached': trafficStats.totalCarsApproached,
      'Avg cars per minute': carsPerMinute,
      'Avg approaches per minute': approachPerMinute,
      'Avg wait time (sec)': parseFloat(trafficStats.avgWaitTime)
    };

    console.table(statsReport);

    // Create or update stats display on screen
    updateStatsDisplay(statsReport);

    // Dispatch a custom event with the stats data
    dispatchStatsChangeEvent(statsReport);
  }

  // Function to dispatch a custom stats change event
  function dispatchStatsChangeEvent(statsData) {
    // Create a custom event with the stats data
    const statsChangeEvent = new CustomEvent('trafficStatsChange', {
      detail: statsData,
      bubbles: true,
      cancelable: true
    });

    // Dispatch the event from the simulation container
    const container = document.getElementById('simulation-container');
    if (container) {
      container.dispatchEvent(statsChangeEvent);
    }
  }

  // Function to create/update stats display on screen
  function updateStatsDisplay(stats) {
    // Check if stats container exists, create if not
    let statsContainer = document.getElementById('traffic-stats');
    if (!statsContainer) {
      statsContainer = document.createElement('div');
      statsContainer.id = 'traffic-stats';
      statsContainer.style.position = 'absolute';
      statsContainer.style.top = '65px';
      statsContainer.style.left = '10px';
      statsContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      statsContainer.style.color = 'white';
      statsContainer.style.padding = '10px';
      statsContainer.style.borderRadius = '5px';
      statsContainer.style.fontFamily = 'Arial, sans-serif';
      statsContainer.style.fontSize = '14px';
      statsContainer.style.zIndex = '1000';
      document.body.appendChild(statsContainer);

      // Add a data attribute to make it easier to identify this is a stats container
      statsContainer.setAttribute('data-stats-container', 'true');
    }

    // Update content
    let html = '<h3>Traffic Statistics</h3>';
    for (const [key, value] of Object.entries(stats)) {
      // Add appropriate units for display only (keeping the actual values numeric)
      let displayValue = value;
      if (key === 'Time since last signal change' || key === 'Time since first car stopped') {
        displayValue = value + ' seconds';
      } else if (key === 'Avg cars per minute' || key === 'Avg approaches per minute') {
        displayValue = value + ' cars/min';
      } else if (key === 'Avg wait time (sec)') {
        displayValue = value + ' seconds';
      }
      html += `<div><strong>${key}:</strong> ${displayValue}</div>`;
    }
    statsContainer.innerHTML = html;
  }

  // Set up periodic stats reporting

  // Animation loop
  function animationLoop() {
    if (!trafficRunning) return;

    moveCars();
    removeOffscreenCars();
    checkTrafficLightChanges();
    requestAnimationFrame(animationLoop);
  }

  // Function to check if traffic lights have changed and update stopped cars
  function checkTrafficLightChanges() {
    // Define intersection boundaries for quick reference
    const topCrosswalkY = centerY - roadWidth / 2 - 20;
    const bottomCrosswalkY = centerY + roadWidth / 2 + 5;
    const leftCrosswalkX = centerX - roadWidth / 2 - 20;
    const rightCrosswalkX = centerX + roadWidth / 2 + 5;

    // Check if lights are green for each direction
    const northSouthCanProceed = trafficLightState.northSouth === 'green';
    const eastWestCanProceed = trafficLightState.eastWest === 'green';

    // Track which directions have a green light
    const greenDirections = new Set();
    if (northSouthCanProceed) {
      greenDirections.add('north');
      greenDirections.add('south');
    }
    if (eastWestCanProceed) {
      greenDirections.add('east');
      greenDirections.add('west');
    }

    // Count stopped cars before updating
    let stoppedCount = 0;
    for (let i = 0; i < cars.length; i++) {
      if (cars[i].isStopped) {
        stoppedCount++;
      }
    }
    trafficStats.stoppedCarsCount = stoppedCount;

    // Update all cars based on current light state
    for (let i = 0; i < cars.length; i++) {
      const car = cars[i];
      const canProceed = greenDirections.has(car.direction);

      // Check if car is approaching or in the intersection
      const approachingIntersection = (
        (car.direction === 'north' && car.y <= bottomCrosswalkY + 150 && car.y > bottomCrosswalkY) ||
        (car.direction === 'south' && car.y >= topCrosswalkY - car.height - 150 && car.y < topCrosswalkY - car.height) ||
        (car.direction === 'east' && car.x >= leftCrosswalkX - car.width - 150 && car.x < leftCrosswalkX - car.width) ||
        (car.direction === 'west' && car.x <= rightCrosswalkX + 150 && car.x > rightCrosswalkX)
      );

      // Track if this car is newly approaching the intersection
      if (approachingIntersection && !car.hasApproached) {
        car.hasApproached = true;
        trafficStats.totalCarsApproached++;
      }

      // If light is red and car is approaching the intersection, make it stop
      if (!canProceed && approachingIntersection) {
        // Generate a random offset for stopping at traffic lights if not already set
        if (!car.lightStopOffset) {
          // Random offset between -5 and +5 pixels
          car.lightStopOffset = Math.floor(Math.random() * 10) - 5;
        }

        // Set stop position based on direction
        if (car.direction === 'north') {
          car.stopY = Math.round(bottomCrosswalkY + 15 + car.lightStopOffset);
          car.shouldStop = true;
        } else if (car.direction === 'south') {
          car.stopY = Math.round(topCrosswalkY - car.height + car.lightStopOffset);
          car.shouldStop = true;
        } else if (car.direction === 'east') {
          car.stopX = Math.round(leftCrosswalkX - car.width + car.lightStopOffset);
          car.shouldStop = true;
        } else if (car.direction === 'west') {
          car.stopX = Math.round(rightCrosswalkX + 15 + car.lightStopOffset);
          car.shouldStop = true;
        }

        // Record the time when the car starts waiting
        if (!car.waitStartTime) {
          car.waitStartTime = Date.now();
        }
      }

      // If car is stopped and its light is green, set a random reaction delay
      if (car.isStopped && canProceed) {
        // If the car has been waiting, calculate wait time and update stats
        if (car.waitStartTime) {
          const waitTime = (Date.now() - car.waitStartTime) / 1000; // in seconds
          trafficStats.totalWaitTime += waitTime;
          trafficStats.carsWaited++;
          trafficStats.avgWaitTime = trafficStats.carsWaited > 0 ?
            parseFloat((trafficStats.totalWaitTime / trafficStats.carsWaited).toFixed(2)) : 0;

          // Reset wait start time
          car.waitStartTime = null;
        }
        // Calculate a random delay based on position in queue
        // First car has a shorter delay (0.5-1.5s), subsequent cars have longer delays (1-3s)
        let isFirstInQueue = true;

        // Check if this car is behind another car in the same lane
        for (let j = 0; j < cars.length; j++) {
          if (i === j) continue; // Skip self

          const otherCar = cars[j];
          if (car.direction !== otherCar.direction || car.lane !== otherCar.lane) continue;

          // Check if other car is ahead of this one
          if ((car.direction === 'north' && car.y > otherCar.y) ||
            (car.direction === 'south' && car.y < otherCar.y) ||
            (car.direction === 'east' && car.x < otherCar.x) ||
            (car.direction === 'west' && car.x > otherCar.x)) {
            isFirstInQueue = false;
            break;
          }
        }

        // Set reaction delay based on position in queue
        const minDelay = isFirstInQueue ? 500 : 1000; // milliseconds
        const maxDelay = isFirstInQueue ? 1500 : 3000; // milliseconds
        const delay = Math.random() * (maxDelay - minDelay) + minDelay;

        // Set a timeout to release the car after the delay
        setTimeout(() => {
          car.shouldStop = false;
          car.isStopped = false;
          car.stopX = undefined;
          car.stopY = undefined;
        }, delay);
      }
    }
  }
});