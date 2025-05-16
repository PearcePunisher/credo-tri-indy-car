import React from 'react';
import { Image, View, StyleSheet } from 'react-native';

interface Props {
  teamData: any;
}

export const TeamSquareLogo: React.FC<Props> = ({ teamData }) => {
  const image =
    teamData?.team_logos?.team_square_logos?.[0]?.formats?.medium?.url ??
    teamData?.team_logos?.team_square_logos?.[0]?.url;

  if (!image) return null;

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: `https://timely-actor-10dfb03957.media.strapiapp.com${image}` }}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 12,
  },
  image: {
    width: 150,
    height: 150,
  },
});
