/* 
   File:     tpc_3d.js
   Author:   Daniel Coderre
   Date:     29.04.2014

   Brief:    Helper functions to make a 3D event display work

*/
/* This is a bunch of stuff to make the 3D TPC event display work */
//<script type="x-shader/x-vertex" id="vertexshader">
//var vertexShader = "void main() { gl_Position = vec4(position,1.0); }";//vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 ); gl_Position = projectionMatrix * mvPosition; }";
//</script>
//gl_PointSize =16.0;
//<script type="x-shader/x-fragment" id="fragmentshader">
//var fragmentShader = "uniform sampler2D texture; uniform vec3 color; uniform float alpha; void main() { gl_FragColor = vec4( color, alpha ); gl_FragColor = gl_FragColor * texture2D( texture, gl_PointCoord ); }";
//</script>

function ExtractChannelWaveforms(data, whichs2, hidelist){
    // Extract channel waveforms from dict and return in dygraph format   
      // where first element [0] is channel number              
    
    var retarray = [];
    
    // Do the first element                                                        
    var line = [];
    for (var key in data['s2s'][whichs2]['channel_waveforms'])
          line.push(key);
    retarray.push(line);
      for(channel = 0; channel<line.length; channel+=1){
          if(hidelist.length != 0 && $.inArray(line[channel], hidelist) != -1)
              continue;
          element = 1;
          for(index = 0; index<data['s2s'][whichs2]['channel_waveforms'][line[channel]].length;
              index+=1){
              if(data['s2s'][whichs2]['channel_waveforms'][line[channel]][index] == 'z'){
                  nzeros = parseInt(data['s2s'][whichs2]['channel_waveforms'][line[channel]][index+1]);
                  for(j=0;j<nzeros;j++){
                      if(retarray.length<element+1){
                          retarray.push([0.]);
                          element+=1;
                      }
                      else {
                          retarray[element].push(0.);
                          element+=1;
                      }
                  }
                  index+=1;
                  continue;
              }
	      else{
                  if(retarray.length<element+1){
                      retarray.push([parseFloat(data['s2s'][whichs2]['channel_waveforms'][line[channel]][index])]);
                      element+=1;
                  }
                  else{
                      retarray[element].push(parseFloat(data['s2s'][whichs2]['channel_waveforms'][line[channel]][index]));
                      element+=1;
                  }
              }
	      
          } // end for through this packed data  
      } // end for through channels     
    return retarray;
}

function UnzipWaveforms(data){
    // Unzip compressed waveforms and put the sum and filtered into one dict 
    // Return value is this dict 
    var filtered_waveform = [];
    var sum_waveform = [];

    //bottleneck is transfer. so use browser to decompress waveform                
    for(i=0;i<data['filtered_waveform'].length;i++){
        if(data['filtered_waveform'][i]=="z"){
            nzeros=parseInt(data['filtered_waveform'][i+1]);
            for(j=0;j<nzeros;j++)
                filtered_waveform.push(0.);
            i=i+1;
            continue;
        }
        else
            filtered_waveform.push(parseFloat(data['filtered_waveform'][i]));
    }
    for(i=0; i<data['sum_waveform'].length;i++){
        if(data['sum_waveform'][i]=="z"){
            nzeros = parseInt(data['sum_waveform'][i+1]);
            for(j=0; j<nzeros; j++)
                sum_waveform.push(0.);
            i=i+1;
            continue;
        }
        else
            sum_waveform.push(parseFloat(data['sum_waveform'][i]));
    }

    // Put together                                                                
    var total_data = [];
    for(i=0;i<sum_waveform.length;i++)
        if(i<filtered_waveform.length)
            total_data.push([i,sum_waveform[i],filtered_waveform[i]]);
    return total_data;
};

function draw_full_waveform( div, unzipped_data ){
    
    draw_waveform( div, unzipped_data, "" );
}
function draw_peak( div, data, unzipped_data, ID, peaktype, title ){
    
    // Check for invalid peak types
    if( peaktype != 's1s' && peaktype != 's2s' ){
	console.log(" tpc_3d::draw_peak ERROR unknown peak type " + peaktype );
	return;
    }

    // Check that the S1 is there
    if( data[peaktype].length < ID+1 ){
	console.log( "tpc_3d::draw_d1 - ERROR requested S1 out of bounds");
	return;
    }
    
    // Compute boundaries
    leftb = data[peaktype][ID]['left'];
    rightb = data[peaktype][ID]['right'];
    buffer = Math.ceil( .1*( rightb - leftb ));
    leftb = leftb - buffer;
    if( leftb < 0 ) leftb = 0;
    rightb = rightb + buffer;
    if( rightb > unzipped_data.length ) rightb = unzipped_data.length;
    
    // Slice the waveform around the S1
    waveform = unzipped_data.slice( leftb, rightb );
    
    draw_waveform( div, waveform, title );   
}

function draw_waveform( div, thedata, thetitle ){
    
    graph = new Dygraph( div, thedata, 
			 { 
			     legend: "never",
			     labelsDivWidth: 0,
			     axisLabelColor: "#AAAAAA",
			     axisLineColor: "#AAAAAA",
			     title: thetitle,
			     showRoller: false,
			     rollPeriod: 1,
			     labels: ["bin (10ns)", "sum_waveform", "filtered_waveform"],
			     ylabel: "p.e.",
			     xlabel: "bin (10ns)",
			     colors: ['#09E042', '#0995E0'],
                      });    
}

function draw_hit_location( scene, data, hit_locs )
// Draw a little circle at hit location
{
    var imm_to_threejs = 10.;

    posx = data['position']['x']*imm_to_threejs*-1;  // -1 to get geometry right
    posz = data['position']['y']*imm_to_threejs;

    // Right now we have no z position so set random y
    posy = Math.random() * 1000 + 100;

    if( hit_locs.length > 100 ){
	scene.remove( hit_locs[0] );
	hit_locs.shift();
    }

    // Modify most recent to make smaller
    if( hit_locs.length > 0 ){
	
	hit_locs[ hit_locs.length -1 ].scale.x = .5;
	hit_locs[ hit_locs.length -1 ].scale.y = .5;
	hit_locs[ hit_locs.length -1 ].scale.z = .5;
    }

    var hit_marker = new THREE.Mesh( new THREE.SphereGeometry( 15, 8, 6 ),
				     new THREE.MeshLambertMaterial( { color: 0xffffff} ) 
				   ) ;
    hit_marker.overdraw = true;
    hit_marker.position.x = posx;
    hit_marker.position.y = posy;
    hit_marker.position.z = posz;
    
    hit_locs.push( hit_marker );
    scene.add( hit_marker );    
}

function draw_hitpattern( scene, camera, renderer, hits, data )
// Draw the hit pattern
{
    var iScaleMultiplier = 3;
    var iPositionTopArray = 1200;
    var iPositionBottomArray = 0;
    var iPmtHeightCorrection = 3000;
    var iPmtSpeedFactor = 5;

    // Clear hits array first
    for ( x=0; x<hits.length; x++ ){	
	scene.remove( hits[x] );
    }
    hits.length = 0;
    
    // This will hold the heights, which
    cylinder_heights = [];

    // Loop through hits and define 'pmt' size and color
    for(x=0;x<data['s2s'][0]['hits'].length;x++){

	// This makes a RELATIVE amplitude (height of pmt
	// is only determined by other hits in S2)
	amp = data['s2s'][0]['hits'][x][3]/data['s2s'][0]['area'];
	
	if( amp == 0. ) amp = 0.00001;
	if( amp > 1. ) amp = 1.;
	
	var hit = new THREE.Mesh(new THREE.CylinderGeometry(25,25,0),
				 new THREE.MeshLambertMaterial({color:0xffff00}));

	// The color will be determined such that the largest hit is 
	// at the 'top' of the pallete and the smallest should be at the bottom
	colz = GetColor( data['s2s'][0]['hits'][x][3]/data['s2s'][0]['max_hit'] );
	
	// Set color
	hit.material.color.setRGB( colz[0],
                                   colz[1],
                                   colz[2] );

	// Make it glow
        hit.material.emissive.setRGB(colz[0],
                                     colz[1],
                                     colz[2] );

	// Look up what this does
	hit.overdraw = true;

	hit.position.x = data['s2s'][0]['hits'][x][1]*iScaleMultiplier;
        hit.position.z = data['s2s'][0]['hits'][x][2]*iScaleMultiplier;
	
	// Draw at proper y position
	if( parseInt( data['s2s'][0]['hits'][x] ) <= 98 )
	    hit.position.y = iPositionTopArray;
	else
	    hit.position.y = iPositionBottomArray;

	hits.push( hit );
	cylinder_heights.push( iPmtHeightCorrection * amp );

	scene.add( hit );
    } //end loop through hits

    // Now to actually animate the thing
    var currentLen = 0;

    function hitsAnimation(){
	
	// Set to true once all hits set to proper size
	var oneHitStillGoing = false;
	currentLen += iPmtSpeedFactor;
	
	// Loop through hits and adjust height as needed
	for( x = 0; x < hits.length; x++ ){

	    if( currentLen < cylinder_heights[x] ){
		oneHitStillGoing = true;
		
		// The only way to update cylinder height is actually
		// to remove the old cylinder and draw a new one
		scene.remove( hits[x] );
		hits[x].geometry = new THREE.CylinderGeometry( 25, 25, currentLen );
		scene.add( hits[x] );
	    }
	}

	if( oneHitStillGoing ) {
	    renderer.render( scene, camera );
	    requestAnimationFrame( hitsAnimation );
	}
	else
	    return;
    }
    
    // Call the animation function
    requestAnimationFrame( hitsAnimation );
}

function draw_tpc(scene, camera, renderer, path)
//This is the main animation function
//It is responsible for drawing the main animation loop
// Do not confuse this with MakeAnimation below, which draws the electron cartoon
{
    loader = new THREE.JSONLoader();
    loader.load( path, 
		 function (geometry, materials){
		     loaded=true;
		    /*      
			    // This is for the "metal looking" TPC
			    var TPC_Material = new THREE.MeshPhongMaterial( {  
			    emissive: 0x111111,
                            transparent: true,
                            opacity: 0.2,
			    shininess: 50,
			    ambient: 0x404040,
			    color: 0xf0f0f0,
			    specular: 0xf0f0f0,
			    metal: true,
			    shading: THREE.flatShading,
			    });                                                                            */
		     var TPC_Material = new THREE.MeshBasicMaterial( {
			 wireframe: true,
			 wireframeLinewidth: 1,//.8,
                         color: 0x2194ce,
			 //        color: 0x144c69,
			 transparent: true,
			 opacity: 0.1,
			 vertexColors: THREE.NoColors,
			 //shading: THREE.smoothShading,
		     });

		    mesh = new THREE.Mesh(geometry, TPC_Material);
		    mesh.geometry.computeFaceNormals();
		    mesh.geometry.computeVertexNormals();
		    scene.add(mesh);
		    mesh.position.y = 900;
		}); // end load function
}

function GetV(seed){
    // seed is between 0 and 1. This returns a random 
    // number with magnitude at least 5                                                                        
      absval = (12.*seed - 6.)*12.;
      if(absval<0)
          absval-=5.;
      if(absval>=0)
          absval+=5.;
      return absval;
}

function GetColor( amp )
{
    var colz = [ 0, 0, 0];
    //amp *= 30;
    // CONSTANTS

    //amp*=50;
    //console.log("Color amp");
    //console.log(amp);
    var m_r = 434;
    var offset_r = -217;

    // col_g ==217 at .5, 35 at 0, 1
    var col_g = (Math.abs(.5-amp)) * 217;
    //var m_g = 55;
    //var offset_g = 0;

    //var m_b = 55;
//    var offset_b = 0;
    var col_b = (Math.abs(1.-amp))*434 - 217;

      var col_r = amp * m_r + offset_r;
    //var col_g = 155-(amp * m_g + offset_g);
    //var col_b = 155-(amp * m_b + offset_b);

    if( col_r < 35 ) col_r = 35;
    if( col_r > 217 ) col_r = 217;
    if( col_g < 35 ) col_g = 35;
    if( col_g > 217 ) col_g = 217;
    if( col_b < 35 ) col_b = 35;
    if( col_b > 217 ) col_b = 217;

    colz[0] = col_r / 255.;
    colz[1] = col_g / 255.;
    colz[2] = col_b / 255.;
    return colz;
}

function MakeAnimation(xv, yv, zv, s1, s2, threeScene, threeCamera, threeRenderer, options){
    /*
      Makes a TPC animation including photons and drifting e-

      xv, yv, zv define the interaction vertex
      s1 and s2 are the amplitudes of s1 and s2 in PE

      the scene, camera, and renderer should have already been declared in the calling function

      options is a dict. 
      
     */

    if(options['audio']){
	document.getElementById(options['s1_audioDiv']).load();
	document.getElementById(options['s2_audioDiv']).load();
    }

    // Keep track of how many times a photon bounces
    var nbounces = [];

    // Keep track of if an electron was photonized
    var photonized = [];

    // Create geometry and materials for electrons and photons
    var photons = new THREE.Geometry();
    var electrons = new THREE.Geometry();

    // attributes
    /*var attributes = {
        //alpha: { type: 'f', value: [] },
    };
    // uniforms
    var uniforms = {
        color: { type: "c", value: new THREE.Color( 0xaaffff ) },
	alpha: { type: 'f', value: .6 },
	texture: { type: "t", value: THREE.ImageUtils.loadTexture( options['imagepath'] )},
    };

    // point cloud material
    var p_material = new THREE.ShaderMaterial( {
        uniforms:       uniforms,
        attributes:     attributes,
        vertexShader:   vertexShader,
        fragmentShader: fragmentShader,
        transparent:    true
	
    });*/
    var p_material = new THREE.PointCloudMaterial({
	color: 0xAAFFFF,
	size: 25,
	opacity: 0.3,
	map: THREE.ImageUtils.loadTexture( options['imagepath']),
//	    "{{STATIC_URL}}images/particle_1.png"),
	blending: THREE.AdditiveBlending,
//	transparent: true,
    });
  //  p_material.color.setHSL( Math.random(), 0.9, 0.7);
    
    var e_material = new THREE.PointCloudMaterial({
	color: 0xFFFFFF,
	size: 40,
	opacity: 0.3,
	map: THREE.ImageUtils.loadTexture( options['imagepath'] ),
//	    "{{STATIC_URL}}images/particle_1.png"),
	blending: THREE.AdditiveBlending,
//	transparent: true,
    });
//    e_material.color.setHSL( Math.random(), 0.9, 0.7 );

    // Decide how many photons and electrons should be created
    var n_electrons = options['electrons_s2'];
    var n_photons   = options['photons_s1'];
    if ( options['dynamic_s1s2'] ){
	// In this case n_electrons and n_photons is the max
	// Give for example largest s2=1000 largest s1=100
	n_electrons = n_electrons*Math.ceil(s2/1000.);	
	n_photons   = n_photons*Math.ceil(s1/100.);
	
	// Don't kill my browser!
	if( n_electrons > 30 ){
	    n_electrons = 30;
	    n_photons = n_electrons*options['pe_electron']
	}
	
	// However must have at least n_pe*n_electrons photons
	if(options['pe_electron']*n_electrons > n_photons)
	    n_photons = options['pe_electron']*n_electrons;
    }

    // Create the initial burst of photons. Give them a random velocity.
    // Cheat a little bit and double the velocity in y-direction (vertical)
    for ( x=0; x<n_photons; x++ ){
	//attributes.alpha.value[ x ] = .1;
	var particle = new THREE.Vector3( xv, yv, zv );
	particle.velocity = new THREE.Vector3( GetV(Math.random()),
					       GetV(Math.random())*4, 
					       GetV(Math.random()) );
	photons.vertices.push(particle);
	nbounces.push(0);
    }

    // Create the drift electrons
    for ( x=0; x<n_electrons; x++ ){ 
	var particle = new THREE.Vector3( xv+(40.*Math.random()-20.),
					  yv+(40.*Math.random()-20.),
					  zv+(40.*Math.random()-20.) );
	particle.velocity = new THREE.Vector3( 0, 10., 0);
	electrons.vertices.push(particle);
	photonized.push(false);
    }
    // Create a light to move along with the electrons and illuminate them
    var electron_light = new THREE.PointLight( 0x888888, 10., 50. );
    electron_light.position.x = xv;
    electron_light.position.y = yv;
    electron_light.position.z = zv;
    threeScene.add(electron_light);

    // Create a lens flare to go with the electron light
    var flareColor = new THREE.Color( 0xffffff );
    flareColor.setHSL( .55, .9, .5 + 0.5 );
    var textureFlare0 = THREE.ImageUtils.loadTexture( options["flaretex0"] );
    var textureFlare2 = THREE.ImageUtils.loadTexture( options["flaretex2"] );
    var textureFlare3 = THREE.ImageUtils.loadTexture( options["flaretex3"] );
    var lensFlare = new THREE.LensFlare( textureFlare0, 700, 0.0, THREE.AdditiveBlending, flareColor );
    lensFlare.add( textureFlare2, 512, 0.0, THREE.AdditiveBlending );
    lensFlare.add( textureFlare2, 512, 0.0, THREE.AdditiveBlending );
    lensFlare.add( textureFlare2, 512, 0.0, THREE.AdditiveBlending );
    lensFlare.add( textureFlare3, 60, 0.6, THREE.AdditiveBlending );
    lensFlare.add( textureFlare3, 70, 0.7, THREE.AdditiveBlending );
    lensFlare.add( textureFlare3, 120,0.9, THREE.AdditiveBlending );
    lensFlare.add( textureFlare3, 70, 1.0, THREE.AdditiveBlending );
    lensFlare.customUpdateCallback = lensFlareUpdateCallback;
    lensFlare.position.copy( electron_light.position );
    scene.add( lensFlare );

    // Create a light to flash at the s1 position
    var s1_light = new THREE.PointLight( 0x888888, 0., 10000. );
    s1_light.position.x = 0;//xv; 
    s1_light.position.y = 400;//yv;
    s1_light.position.z = 0;//zv;
    threeScene.add(s1_light);

    // Define the point cloud systems for e and gammas
    var photon_system = new THREE.PointCloud( photons, p_material );
    photon_system.sortParticles = true;
    //photon_system.scale.set(199, 100, 100);
    var electron_system = new THREE.PointCloud( electrons, e_material );
    electron_system.sortParticles = true;
    //electron_system.scale.set(32,32,1.);
    threeScene.add(photon_system);
    threeScene.add(electron_system);

    // Play s1 torpedo
    if ( options['audio'] )
        document.getElementById(options['s1_audioDiv']).play();
    var photonizeCount = 0;
    var s1_flash_count = 0;
    var s1_fading = false;

    // Make the animation function for the hit
    function animation(){
	
	// Use these bools to decide when animation is finished
	var onePhotonStillGoing = false;
	var oneElectronStillGoing = false; 

	// First move the electrons
	for( x=0; x<electrons.vertices.length; x++ ){
	    
	    var electron = electrons.vertices[x];
	    
	    // if electron hits the gas phase it showers
	    if ( electron.y > 1050 ){
		
		// remove the electron itself from the scene
		electron.velocity.y = 0;
		
		// if it hasn't alhready photonized, do that
		if ( !photonized[x] ){
		    photonized[x] = true;
		    
		    // Can add flash here later if needed
		    
		    // Play sound 
		    if ( photonizeCount == 0 ){
			    if( options['audio'] )
			document.getElementById(options['s2_audioDiv']).play();		    		    
			s1_flash_count = 1;
			photonizeCount+=1;
		    }

		    // Make the photons
		    for ( y=0; y < options['pe_electron']; y++ ){
			
			var newphoton = photons.vertices[ (options['pe_electron'] *x ) + y ];
			newphoton.x = electron.x;
			newphoton.y = electron.y;
			newphoton.z = electron.z;
			newphoton.velocity.x = GetV(Math.random());
			newphoton.velocity.y = GetV(Math.random());
			newphoton.velocity.z = GetV(Math.random());
		    }		    
		}
		electron.y = 150000;

		continue;
	    }
	    
	    // If the electron hasn't reached the top then move it
	    // Also add some spread to the cloud
	    oneElectronStillGoing = true;
	    electron.velocity.y *= 1.02; // accelerate
	    electron.x += Math.random()*20. -10.;
	    electron.z += Math.random()*20. -10.;
	    electron.add(electron.velocity);

	    // put the electron light in the proper place
	    if( x == 0 ){
		electron_light.position.y = electron.y;
		lensFlare.position.copy( electron_light.position );
	    }
	} // end for electrons

	// Make the s1 flash	
	if( s1_flash_count < 99 ){
	 
	    if( s1_fading ){	    
		if ( s1_light.intensity > 0. )
		    s1_light.intensity -= 250.;
		else if ( s1_light.intensity <= 0. && s1_flash_count >= 3){
		    s1_flash_count = 100;
		}
		else if( s1_light.intensity <=0. && s1_flash_count <3){
		    s1_fading = false;
		    s1_flash_count += 1;
		}
	    }
	    else {
		if( s1_light.intensity < 500. )
		    s1_light.intensity += 250;
		else
		    s1_fading = true;
	    }
	}
		    
	    
	// Do photon animation
	for ( x=0; x<photons.vertices.length; x++ ){

	    var photon = photons.vertices[x];
	    
	    // Should bounce around inside TPC
	    if ( Math.sqrt( Math.pow(photon.x, 2) + Math.pow(photon.z, 2)) > 360){
		// speed them up when they bounce (get rid of faster)
		photon.velocity.x *= -1.5;
		photon.velocity.z *= -1.5;
		nbounces[x] += 1;
	    }

	    if ( photon.y > 1200 || photon.y < -50 || nbounces[x] > 2 ){
		photon.velocity = new THREE.Vector3(0., 0., 0.);
		photon.y = 150000;
		continue;
	    }
	    
	    onePhotonStillGoing = true;
	    photon.add(photon.velocity);	    
	}// end for through photon animation

	// Remove electron light from scene if they're not going anymore
	if ( !oneElectronStillGoing ){
	    threeScene.remove(electron_light);
	    threeScene.remove(lensFlare);
/*	    function FadeFlareAnimation(){                                         
                if(lensFlare.opacity <=0){        
                    threeScene.remove(lensFlare);    		    
                    return;                                       
                }       
                lensFlare.opacity -= .01; 
                threeRenderer.render(threeScene, threeCamera); 
                requestAnimationFrame(FadeFlareAnimation); 
            }   
            requestAnimationFrame(FadeFlareAnimation); 
*/
	}
	// Add s2 flash here if wanted
	
	// Clean up scene if everything is done
	if ( !oneElectronStillGoing && !onePhotonStillGoing ){
	    threeScene.remove(photon_system);
	    threeScene.remove(electron_system);
	    threeScene.remove(s1_light);
	    return;
	}

	// Tell system that vertices are updated
	photon_system.geometry.__dirtyVertices = true;
        electron_system.geometry.__dirtyVertices = true;
	
	// Render
	threeRenderer.render(threeScene,threeCamera);
        requestAnimationFrame(animation);	
    }//end animation function

    requestAnimationFrame(animation);
}



function lensFlareUpdateCallback( object ) {
    var f, fl = object.lensFlares.length;
    var flare;
    var vecX = -object.positionScreen.x * 2;
    var vecY = -object.positionScreen.y * 2;
    for( f = 0; f < fl; f++ ) {
	   flare = object.lensFlares[ f ];
	   flare.x = object.positionScreen.x + vecX * flare.distance;
	   flare.y = object.positionScreen.y + vecY * flare.distance;
	   flare.rotation = 0;
	}
    object.lensFlares[ 2 ].y += 0.025;
    object.lensFlares[ 3 ].rotation = object.positionScreen.x * 0.5 + THREE.Math.degToRad( 45 );
}
