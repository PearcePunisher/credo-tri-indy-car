import * as FileSystem from 'expo-file-system';


//we won't worry about pre-parsing this data, let's ingest first
//then treate these in place of the API calls. 

const G_Cs = {
    LAST_UPDATE_FILE : FileSystem.documentDirectory + "last_retrieved.txt",
    USER_DATA_FILE : FileSystem.documentDirectory + "user_data.json",
    TRACK_DATA_REQ_URL : "https://timely-actor-10dfb03957.strapiapp.com/api/events/vu1onbgx4osmfr94vstx9i1l?populate=*",
    TRACK_IMAGE_REQ_URL: "https://timely-actor-10dfb03957.strapiapp.com/api/events/vu1onbgx4osmfr94vstx9i1l/?populate[event_downloadables][populate][event_downloadables_file]=true&populate[event_downloadables][populate][event_downloadables_cover_image]=true",
    TRACK_DATA_FILE : FileSystem.documentDirectory + "track_data.json",
    DRIVERS_DATA:{
        REQ_URL:"https://timely-actor-10dfb03957.strapiapp.com/api/drivers?populate[driver_image]=true&populate[driver_social_medias]=true&populate[driver_record]=true&populate[car][populate][car_images][populate]=car_image_side&populate[driver_current_season_stats]=true&populate[driver_career_stats]=true",
        FILE: FileSystem.documentDirectory + "drivers_data.json"
    },
    FAQ_DATA:{
        REQ_URL:"https://strapi.wickedthink.com/api/faqs?populate=*", 
        FILE: FileSystem.documentDirectory + "faq_data.json"
    }
}   

    export async function createFilesForFirstTime(){
        var now_date = new Date();
        if( await FileSystem.writeAsStringAsync(G_Cs.LAST_UPDATE_FILE, now_date)){
                console.log("Success!");
        }
        var list = "track_data";

        G_Cs["LAST_UPDATE_FILE"]
       /* Object.entries(G_Cs.forEach(([key, value]) => {
            console.log(`${key}: ${value}`);
        });*/
    }


   export function getGlobalConsts(){
        return G_Cs;
    }


    export async function checkForUpdate(){

        return false;
    }

    export async function updateOfflineFiles(){
        if(await checkForUpdate()!=false){

        }
    }